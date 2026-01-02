#!/bin/bash

# Development script for running both frontend and backend servers

# Get the absolute path to the script's directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Function to display usage instructions
show_usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  help    Show this help message (default)"
    echo "  run     Start the development servers"
    echo "  stop    Stop the development servers"
    echo "  status  Show running server processes and port status"
    echo "  clean   Clean node_modules, build directories, and cache"
    echo "  build   Build the frontend and backend for production"
    echo "  check   Compare git-tracked files with filesystem files"
    echo ""
    exit 1
}

# Function to check files
check_files() {
    echo "Checking files in git against filesystem..."
    
    # Create temporary files
    git_files=$(mktemp)
    fs_files=$(mktemp)
    filtered_files=$(mktemp)
    untracked_temp=$(mktemp)
    missing_temp=$(mktemp)
    ignored_temp=$(mktemp)

    # Get list of all files tracked by git (excluding .git directory)
    git ls-files | grep -v '/$' | grep -v '^frontend$' | sort > "$git_files"
    
    # Get ALL files in filesystem first (including ones that would be filtered)
    find . -type f \
        ! -path "*/.git/*" \
        | sed 's|^\./||' \
        | sort > "$filtered_files"
    
    # Get list of non-filtered files in filesystem
    find . -type f \
        ! -path "*/\.*" \
        ! -path "*/node_modules/*" \
        ! -path "*/build/*" \
        ! -path "*/audio-cache/*" \
        ! -path "*/data/*" \
        ! -name ".DS_Store" \
        | sed 's|^\./||' \
        | sort > "$fs_files"

    # Get list of files ignored by .gitignore
    git status --ignored --porcelain | grep '^!!' | cut -c4- > "$ignored_temp"
    ignored_count=$(wc -l < "$ignored_temp" | tr -d ' ')
    
    # Find untracked files (files in filesystem but not in git)
    comm -23 "$fs_files" "$git_files" > "$untracked_temp"
    untracked_count=$(wc -l < "$untracked_temp" | tr -d ' ')
    
    # Find missing files (files in git but not in filesystem)
    comm -13 "$fs_files" "$git_files" > "$missing_temp"
    missing_count=$(wc -l < "$missing_temp" | tr -d ' ')
    
    # Find filtered files (files that match exclusion patterns)
    filtered_temp=$(mktemp)
    comm -23 "$filtered_files" "$fs_files" > "$filtered_temp"
    filtered_count=$(wc -l < "$filtered_temp" | tr -d ' ')
    
    # Initialize counters for each category
    env_count=0
    node_count=0
    build_count=0
    logs_count=0
    os_count=0
    ide_count=0
    audio_count=0
    other_count=0
    
    # Count files by category
    while IFS= read -r file; do
        if [ -n "$file" ]; then  # Only process non-empty lines
            case "$file" in
                *.env|.env*)
                    ((env_count++))
                    ;;
                */node_modules/*)
                    ((node_count++))
                    ;;
                */build/*|*/dist/*)
                    ((build_count++))
                    ;;
                *.log|*/logs/*)
                    ((logs_count++))
                    ;;
                .DS_Store|._*|.Spotlight-V100|.Trashes|Thumbs.db)
                    ((os_count++))
                    ;;
                .idea/*|.vscode/*|*.swp|*.swo)
                    ((ide_count++))
                    ;;
                */audio-cache/*|*.mp3)
                    ((audio_count++))
                    ;;
                *)
                    ((other_count++))
                    ;;
            esac
        fi
    done < "$filtered_temp"
    
    # Print summary
    echo ""
    echo "=== File Check Summary ==="
    echo "Files tracked by git: $(wc -l < "$git_files" | tr -d ' ')"
    echo "Files in filesystem: $(wc -l < "$fs_files" | tr -d ' ')"
    echo "Untracked files: $untracked_count"
    echo "Missing files: $missing_count"
    echo "Filtered files: $filtered_count"
    echo "Ignored files: $ignored_count"
    echo ""
    
    # Print filtered files summary
    if [ $filtered_count -gt 0 ]; then
        echo "=== Filtered Files Summary ==="
        echo "Files excluded by filters:"
        echo ""
        [ $env_count -gt 0 ] && echo "[ENV]: $env_count files"
        [ $node_count -gt 0 ] && echo "[NODE]: $node_count files"
        [ $build_count -gt 0 ] && echo "[BUILD]: $build_count files"
        [ $logs_count -gt 0 ] && echo "[LOGS]: $logs_count files"
        [ $os_count -gt 0 ] && echo "[OS]: $os_count files"
        [ $ide_count -gt 0 ] && echo "[IDE]: $ide_count files"
        [ $audio_count -gt 0 ] && echo "[AUDIO]: $audio_count files"
        [ $other_count -gt 0 ] && echo "[OTHER]: $other_count files"
        echo ""
    fi

    # Print details if there are ignored files
    if [ $ignored_count -gt 0 ]; then
        echo "=== Ignored Files ==="
        echo "The following files are excluded by .gitignore:"
        echo ""
        while IFS= read -r file; do
            if [ -n "$file" ]; then
                echo "$file"
            fi
        done < "$ignored_temp"
        echo ""
    fi
    
    # Print details if there are untracked files
    if [ $untracked_count -gt 0 ]; then
        echo "=== Untracked Files ==="
        echo "The following files exist in the filesystem but are not tracked by git:"
        echo ""
        while IFS= read -r file; do
            if [ -n "$file" ]; then
                echo "$file"
            fi
        done < "$untracked_temp"
        echo ""
    fi
    
    if [ $missing_count -gt 0 ]; then
        echo "=== Missing Files ==="
        echo "The following files are tracked by git but missing from filesystem:"
        echo ""
        while IFS= read -r file; do
            if [ -n "$file" ]; then
                echo "$file"
            fi
        done < "$missing_temp"
        echo ""
    fi
    
    # Cleanup temporary files
    rm -f "$git_files" "$fs_files" "$filtered_files" "$filtered_temp" "$untracked_temp" "$missing_temp" "$ignored_temp"
    
    echo "File check completed!"
    
    # Return non-zero exit code if there are discrepancies
    [ $untracked_count -eq 0 ] && [ $missing_count -eq 0 ]
    return $?
}

# Function to clean the project
clean() {
    echo "Cleaning project directories..."
    
    # Clean frontend
    echo "Cleaning frontend..."
    rm -rf "$SCRIPT_DIR/frontend/node_modules"
    rm -rf "$SCRIPT_DIR/frontend/build"
    
    # Clean backend
    echo "Cleaning backend..."
    rm -rf "$SCRIPT_DIR/backend/node_modules"
    rm -rf "$SCRIPT_DIR/backend/data/audio-cache"
    rm -rf "$SCRIPT_DIR/backend/data/presets"
    rm -rf "$SCRIPT_DIR/backend/data/instructions.json"
    rm -rf "$SCRIPT_DIR/backend/data/api-keys.json"
    rm -rf "$SCRIPT_DIR/backend/data/cache-analytics.json"
    
    echo "Clean completed successfully!"
}

# Function to build the project
build() {
    echo "Building project..."
    
    # Build frontend
    echo "Building frontend..."
    cd "$SCRIPT_DIR/frontend" && npm install && npm run build
    
    # Build backend
    echo "Building backend..."
    cd "$SCRIPT_DIR/backend" && npm install
    
    echo "Build completed successfully!"
}

# Function to show server and port status
status() {
    local frontend_port=3000
    local backend_port=3001

    echo "=== Server Process Status ==="

    if command -v pgrep >/dev/null 2>&1; then
        local frontend_pids
        local backend_pids
        frontend_pids=$(pgrep -f "react-scripts start" || true)
        backend_pids=$(pgrep -f "nodemon server.js|node server.js" || true)

        if [ -n "$frontend_pids" ]; then
            echo "Frontend dev server (react-scripts) running: PID(s) $frontend_pids"
        else
            echo "Frontend dev server (react-scripts) not running"
        fi

        if [ -n "$backend_pids" ]; then
            echo "Backend server (node/nodemon) running: PID(s) $backend_pids"
        else
            echo "Backend server (node/nodemon) not running"
        fi
    else
        echo "Process check skipped (pgrep not available)"
    fi

    echo ""
    echo "=== Port Status ==="

    if command -v lsof >/dev/null 2>&1; then
        check_port_with_lsof() {
            local port=$1
            local label=$2
            local output
            output=$(lsof -n -iTCP:"$port" -sTCP:LISTEN 2>/dev/null)
            if [ -n "$output" ]; then
                echo "$label port $port: IN USE"
                echo "$output" | awk 'NR==1 || NR==2 {print}'
            else
                echo "$label port $port: FREE"
            fi
        }
        check_port_with_lsof "$frontend_port" "Frontend"
        check_port_with_lsof "$backend_port" "Backend"
    elif command -v ss >/dev/null 2>&1; then
        check_port_with_ss() {
            local port=$1
            local label=$2
            if ss -ltn "sport = :$port" | awk 'NR>1 {exit 1} END {exit 0}'; then
                echo "$label port $port: FREE"
            else
                echo "$label port $port: IN USE"
                ss -ltn "sport = :$port"
            fi
        }
        check_port_with_ss "$frontend_port" "Frontend"
        check_port_with_ss "$backend_port" "Backend"
    elif command -v netstat >/dev/null 2>&1; then
        check_port_with_netstat() {
            local port=$1
            local label=$2
            if netstat -an 2>/dev/null | grep -E "[:.]$port .*LISTEN" >/dev/null; then
                echo "$label port $port: IN USE"
                netstat -an 2>/dev/null | grep -E "[:.]$port .*LISTEN" | head -n 1
            else
                echo "$label port $port: FREE"
            fi
        }
        check_port_with_netstat "$frontend_port" "Frontend"
        check_port_with_netstat "$backend_port" "Backend"
    else
        echo "Port check skipped (no lsof/ss/netstat available)"
    fi
}

# Function to stop development servers
stop() {
    local stopped=0
    local frontend_port=3000
    local backend_port=3001
    local extra_stopped=0

    echo "Stopping development servers..."

    if command -v pgrep >/dev/null 2>&1; then
        local frontend_pids
        local backend_pids
        frontend_pids=$(pgrep -f "react-scripts start" || true)
        backend_pids=$(pgrep -f "nodemon server.js|node server.js" || true)

        if [ -n "$frontend_pids" ]; then
            echo "Stopping frontend dev server: PID(s) $frontend_pids"
            kill $frontend_pids 2>/dev/null || true
            stopped=1
        else
            echo "Frontend dev server not running"
        fi

        if [ -n "$backend_pids" ]; then
            echo "Stopping backend server: PID(s) $backend_pids"
            kill $backend_pids 2>/dev/null || true
            stopped=1
        else
            echo "Backend server not running"
        fi
    else
        echo "Process stop skipped (pgrep not available)"
    fi

    if command -v lsof >/dev/null 2>&1; then
        local frontend_blockers
        local backend_blockers
        frontend_blockers=$(lsof -n -iTCP:"$frontend_port" -sTCP:LISTEN -t 2>/dev/null | tr '\n' ' ')
        backend_blockers=$(lsof -n -iTCP:"$backend_port" -sTCP:LISTEN -t 2>/dev/null | tr '\n' ' ')

        if [ -n "$frontend_blockers" ]; then
            echo "Stopping processes blocking port $frontend_port: $frontend_blockers"
            kill $frontend_blockers 2>/dev/null || true
            extra_stopped=1
        fi

        if [ -n "$backend_blockers" ]; then
            echo "Stopping processes blocking port $backend_port: $backend_blockers"
            kill $backend_blockers 2>/dev/null || true
            extra_stopped=1
        fi
    elif command -v ss >/dev/null 2>&1; then
        local frontend_blockers
        local backend_blockers
        frontend_blockers=$(ss -ltnp "sport = :$frontend_port" | awk 'NR>1 {print $NF}' | sed 's/.*pid=\([0-9]\+\).*/\1/' | sort -u | tr '\n' ' ')
        backend_blockers=$(ss -ltnp "sport = :$backend_port" | awk 'NR>1 {print $NF}' | sed 's/.*pid=\([0-9]\+\).*/\1/' | sort -u | tr '\n' ' ')

        if [ -n "$frontend_blockers" ]; then
            echo "Stopping processes blocking port $frontend_port: $frontend_blockers"
            kill $frontend_blockers 2>/dev/null || true
            extra_stopped=1
        fi

        if [ -n "$backend_blockers" ]; then
            echo "Stopping processes blocking port $backend_port: $backend_blockers"
            kill $backend_blockers 2>/dev/null || true
            extra_stopped=1
        fi
    elif command -v netstat >/dev/null 2>&1; then
        echo "Port blocker termination skipped (lsof/ss not available; netstat lacks PID details on some systems)."
    fi

    if [ "$stopped" -eq 0 ] && [ "$extra_stopped" -eq 0 ]; then
        echo "No running development servers found."
    fi
}

# Function to run development servers
run() {
    # Check for required environment variables
    if [ -z "$OPENAI_API_KEY" ]; then
        echo "Warning: OPENAI_API_KEY environment variable is not set"
        echo "Voice generation features using OpenAI will not work"
    fi

    if [ -z "$ELEVENLABS_API_KEY" ]; then
        echo "Warning: ELEVENLABS_API_KEY environment variable is not set"
        echo "Voice generation features using ElevenLabs will not work"
    fi

    # Print startup message
    echo "Starting Meditation App in development mode..."
    echo "Frontend will run on: http://localhost:3000"
    echo "Backend will run on:  http://localhost:3001"
    echo ""
    echo "Using the proxy configuration, all API calls from the frontend"
    echo "will automatically be forwarded to the backend API"
    echo ""

    # Function to kill background processes on exit
    cleanup() {
        echo ""
        echo "Shutting down servers..."
        kill $FRONTEND_PID $BACKEND_PID 2>/dev/null
        exit 0
    }

    # Set up trap to catch Ctrl+C and other termination signals
    trap cleanup SIGINT SIGTERM

    # Start backend server
    echo "Starting backend server..."
    cd "$SCRIPT_DIR/backend" && npm run dev &
    BACKEND_PID=$!

    # Wait a moment to ensure backend has started
    sleep 2

    # Start frontend server
    echo "Starting frontend server..."
    cd "$SCRIPT_DIR/frontend" && npm start &
    FRONTEND_PID=$!

    # Wait for either process to exit
    wait $FRONTEND_PID $BACKEND_PID

    # Clean up
    cleanup
}

# Main script logic
COMMAND=${1:-help}  # Default to 'help' if no command provided

case "$COMMAND" in
    "run")
        run
        ;;
    "stop")
        stop
        ;;
    "status")
        status
        ;;
    "clean")
        clean
        ;;
    "build")
        build
        ;;
    "check")
        check_files
        ;;
    "help")
        show_usage
        ;;
    *)
        echo "Error: Unknown command '$COMMAND'"
        show_usage
        ;;
esac

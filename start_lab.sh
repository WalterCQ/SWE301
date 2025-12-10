#!/bin/bash

# Configuration
RESTART_DELAY=2  # Seconds to wait before restarting

# Cleanup function - kills any orphan node processes
cleanup() {
    echo "Cleaning up old processes..."
    pkill -9 -f "node index.js" 2>/dev/null
    sleep 1
}

# Ensure clean start
cleanup

echo "Starting SWE301 Lab Server in Auto-Restart Mode..."
echo "Press [CTRL+C] to stop the server loop."

while true; do
    echo "----------------------------------------"
    echo "$(date): Server starting..."
    echo "----------------------------------------"
    
    # Ensure database permissions are correct (prevents recurring permission issues)
    touch server/database.sqlite 2>/dev/null
    chmod 666 server/database.sqlite 2>/dev/null
    chmod 777 server 2>/dev/null
    
    # Run the server
    # Set AUTO_RESTART_DELAY for the node process (e.g., 600000 ms = 10 mins)
    # You can override this with env var: AUTO_RESTART_DELAY=600000 ./start_lab.sh
    cd server
    node index.js
    EXIT_CODE=$?
    cd ..
    
    echo "----------------------------------------"
    echo "$(date): Server exited with code $EXIT_CODE."
    
    if [ $EXIT_CODE -eq 130 ]; then
        # Handle Ctrl+C (SIGINT) usually returns 130
        echo "Detected manual stop. Exiting loop."
        break
    fi
    
    # Clean up any zombie processes before restart
    cleanup
    
    echo "Restarting in $RESTART_DELAY seconds..."
    sleep $RESTART_DELAY
done


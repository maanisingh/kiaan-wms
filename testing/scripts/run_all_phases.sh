#!/bin/bash
# Master script to run all 30 phases
# Usage: ./run_all_phases.sh [start_phase] [end_phase]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
START=${1:-1}
END=${2:-30}

echo "=========================================="
echo "  KIAAN WMS - 30 PHASE TEST SUITE"
echo "=========================================="
echo ""
echo "Running phases $START to $END"
echo ""

TOTAL_PASS=0
TOTAL_FAIL=0
FAILED_PHASES=()

for PHASE in $(seq $START $END); do
    PHASE_NUM=$(printf "%02d" $PHASE)
    SCRIPT_NAME="phase_${PHASE_NUM}_*.sh"
    SCRIPT_PATH=$(ls $SCRIPT_DIR/$SCRIPT_NAME 2>/dev/null | head -1)

    if [ -n "$SCRIPT_PATH" ] && [ -f "$SCRIPT_PATH" ]; then
        echo "----------------------------------------"
        echo "Running Phase $PHASE..."
        echo "----------------------------------------"

        bash "$SCRIPT_PATH"
        EXIT_CODE=$?

        if [ $EXIT_CODE -eq 0 ]; then
            ((TOTAL_PASS++))
            echo ""
        else
            ((TOTAL_FAIL++))
            FAILED_PHASES+=($PHASE)
            echo ""
            echo "!!! Phase $PHASE FAILED - Stopping execution !!!"
            echo ""
            break
        fi
    else
        echo "Phase $PHASE: Script not found ($SCRIPT_NAME)"
        echo "Skipping..."
        echo ""
    fi
done

echo "=========================================="
echo "  FINAL SUMMARY"
echo "=========================================="
echo "  Phases Passed: $TOTAL_PASS"
echo "  Phases Failed: $TOTAL_FAIL"
echo ""

if [ $TOTAL_FAIL -eq 0 ]; then
    echo "  ✅ ALL PHASES COMPLETE!"
    exit 0
else
    echo "  ❌ FAILED PHASES: ${FAILED_PHASES[*]}"
    exit 1
fi

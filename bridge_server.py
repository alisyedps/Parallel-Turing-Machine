#!/usr/bin/env python3
"""
bridge_server.py — connects the React frontend to the compiled C binary.

Usage:
    python3 bridge_server.py

The server listens on http://localhost:5000
It expects the C binary to be compiled at ./turing_parallel
Compile with: gcc -fopenmp -O2 -o turing_parallel turing_machine_parallel.c
"""

import subprocess
import json
import re
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)   # allow the React dev server (port 3000) to call this server

BINARY = "./turing_parallel"
OPS = {1: "Addition", 2: "Subtraction", 3: "Multiplication", 4: "Division", 5: "Modulo"}


def parse_output(stdout: str, op: int) -> dict:
    """Parse the C program's stdout into a structured JSON-friendly dict."""

    result = {
        "operation":    OPS.get(op, "Unknown"),
        "initialTape":  "",
        "finalTape":    "",
        "answer":       None,
        "quotient":     None,
        "remainder":    None,
        "serialTime":   None,
        "parallelTime": None,
        "speedup":      None,
        "efficiency":   None,
        "halted":       False,
        "error":        None,
        "raw":          stdout
    }

    if "Machine halted" in stdout:
        result["halted"] = True
        return result

    if "Invalid" in stdout:
        result["error"] = stdout.strip()
        return result

    # Initial tape
    m = re.search(r"Initial [Tt]ape\s*:\s*(\S+)", stdout)
    if m:
        result["initialTape"] = m.group(1)

    # Final tape (addition / subtraction labels differ)
    m = re.search(r"Tape after \w+\s*:\s*(\S+)", stdout)
    if m:
        result["finalTape"] = m.group(1)
    else:
        m = re.search(r"Final [Tt]ape\s*:\s*(\S+)", stdout)
        if m:
            result["finalTape"] = m.group(1)

    # Arithmetic result line
    m = re.search(r"Result of \d+ [+\-x] \d+ = (\d+)", stdout)
    if m:
        result["answer"] = int(m.group(1))

    # Answer of a % b = N
    m = re.search(r"Answer of \d+ % \d+ = (\d+)", stdout)
    if m:
        result["answer"] = int(m.group(1))

    # Division quotient / remainder
    m = re.search(r"Quotient\s*:\s*(\d+)", stdout)
    if m:
        result["quotient"] = int(m.group(1))
    m = re.search(r"Remainder\s*:\s*(\d+)", stdout)
    if m:
        result["remainder"] = int(m.group(1))

    # Performance report
    m = re.search(r"Serial\s+time \(s\)\s*:\s*([\d.]+)", stdout)
    if m:
        result["serialTime"] = float(m.group(1))

    m = re.search(r"Parallel time \(s\)\s*:\s*([\d.]+)", stdout)
    if m:
        result["parallelTime"] = float(m.group(1))

    m = re.search(r"Speedup\s*:\s*([\d.]+)", stdout)
    if m:
        result["speedup"] = float(m.group(1))

    m = re.search(r"Efficiency\s*:\s*([\d.]+)", stdout)
    if m:
        result["efficiency"] = float(m.group(1))

    return result


@app.route("/api/cores", methods=["GET"])
def get_cores():
    """Return the number of logical CPUs available on this Ubuntu system."""
    try:
        count = 0
        with open("/proc/cpuinfo") as f:
            for line in f:
                if line.startswith("processor"):
                    count += 1
        return jsonify({"cores": max(count, 1)})
    except Exception as e:
        return jsonify({"cores": 1, "error": str(e)})


@app.route("/api/run", methods=["POST"])
def run_operation():
    """
    POST body (JSON):
        {
            "a":           12,
            "b":           5,
            "operation":   1,        // 1=Add 2=Sub 3=Mul 4=Div 5=Mod
            "mode":        "parallel", // "serial" or "parallel"
            "cores":       2,
            "threadsPerCore": 2
        }
    """
    if not os.path.isfile(BINARY):
        return jsonify({
            "error": f"Binary '{BINARY}' not found. "
                     f"Compile first: gcc -fopenmp -O2 -o turing_parallel turing_machine_parallel.c"
        }), 500

    data = request.get_json(force=True)
    a              = int(data.get("a",            0))
    b              = int(data.get("b",            0))
    op             = int(data.get("operation",    1))
    mode           = str(data.get("mode", "parallel")).lower()
    cores          = int(data.get("cores",        1))
    threads_core   = int(data.get("threadsPerCore", 1))

    if op < 1 or op > 5:
        return jsonify({"error": "operation must be 1-5"}), 400

    if mode not in ("serial", "parallel"):
        return jsonify({"error": "mode must be 'serial' or 'parallel'"}), 400

    if mode == "serial":
        cores = 1
        threads_core = 1

    # Build the stdin string the C program expects:
    #   serial:   mode \n op \n a \n b \n
    #   parallel: mode \n cores \n threadsPerCore \n op \n a \n b \n
    mode_id = 1 if mode == "serial" else 2
    if mode == "serial":
        stdin_input = f"{mode_id}\n{op}\n{a}\n{b}\n"
    else:
        stdin_input = f"{mode_id}\n{cores}\n{threads_core}\n{op}\n{a}\n{b}\n"

    try:
        proc = subprocess.run(
            [BINARY],
            input=stdin_input,
            capture_output=True,
            text=True,
            timeout=30
        )
        stdout = proc.stdout
        stderr = proc.stderr

        if proc.returncode not in (0, 1) and not stdout:
            return jsonify({"error": stderr or "Binary crashed"}), 500

        result = parse_output(stdout, op)
        result["mode"]           = mode
        result["op"]             = op
        result["cores"]          = cores
        result["threadsPerCore"] = threads_core
        result["totalThreads"]   = cores * threads_core
        result["a"]              = a
        result["b"]              = b
        return jsonify(result)

    except subprocess.TimeoutExpired:
        return jsonify({"error": "Binary timed out after 30 seconds"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/test", methods=["GET"])
def run_tests():
    """Run the --test suite and return the raw output."""
    if not os.path.isfile(BINARY):
        return jsonify({"error": f"Binary '{BINARY}' not found."}), 500
    try:
        proc = subprocess.run(
            [BINARY, "--test"],
            capture_output=True, text=True, timeout=120
        )
        return jsonify({
            "output":   proc.stdout,
            "passed":   "ALL TESTS PASSED" in proc.stdout,
            "exitCode": proc.returncode
        })
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Test suite timed out"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("=" * 52)
    print("  Parallel Turing Machine — Bridge Server")
    print("  Listening on http://localhost:5000")
    print("  Make sure the binary is compiled:")
    print("  gcc -fopenmp -O2 -o turing_parallel turing_machine_parallel.c")
    print("=" * 52)
    app.run(host="0.0.0.0", port=5000, debug=False)

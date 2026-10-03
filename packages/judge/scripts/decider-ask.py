#!/usr/bin/env python3
"""DEC-0017: Mapika/decider-0.8b via decider.infer (strands-decider 0.1.0 cannot load this checkpoint).

CLI shape matches strands-decider ask so the TypeScript runner can pass the same argv.
"""
from __future__ import annotations

import argparse
import json
import sys


def _questions_from_flags(
    noul: list[str] | None,
    choice: list[str] | None,
    score: list[str] | None,
) -> dict[str, dict]:
    questions: dict[str, dict] = {}
    for i, text in enumerate(noul or []):
        questions[f"noul_{i}"] = {"type": "noul", "instructions": text}
    for i, spec in enumerate(choice or []):
        q, _, opts = spec.partition("=")
        if not opts:
            raise SystemExit(f"--choice needs 'question=opt1,opt2': {spec!r}")
        questions[f"choice_{i}"] = {
            "type": "choice",
            "instructions": q,
            "criteria": {o.strip(): "" for o in opts.split(",") if o.strip()},
        }
    for i, spec in enumerate(score or []):
        q, _, levels = spec.partition("=")
        if not levels:
            raise SystemExit(f"--score needs 'question=low,high': {spec!r}")
        questions[f"score_{i}"] = {
            "type": "score",
            "instructions": q,
            "criteria": [s.strip() for s in levels.split(",") if s.strip()],
        }
    if not questions:
        raise SystemExit("ask at least one --noul / --choice / --score question")
    return questions


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="decider-ask")
    sub = parser.add_subparsers(dest="command", required=True)
    ask = sub.add_parser("ask")
    ask.add_argument("checkpoint")
    ask.add_argument("--state", "-s", required=True)
    ask.add_argument("--noul", action="append", default=[])
    ask.add_argument("--choice", action="append", default=[])
    ask.add_argument("--score", action="append", default=[])
    ask.add_argument("--device")
    ask.add_argument("--json", action="store_true")

    args = parser.parse_args(argv)
    if args.command != "ask":
        raise SystemExit(f"unknown command {args.command!r}")
    if not args.json:
        raise SystemExit("--json is required")

    questions = _questions_from_flags(args.noul, args.choice, args.score)

    from decider.infer import Decider

    device = args.device  # None -> Decider auto-selects (cpu on this VM)
    decider = Decider(args.checkpoint, device=device)
    response = decider.system_one(args.state, questions)
    sys.stdout.write(json.dumps(response))
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

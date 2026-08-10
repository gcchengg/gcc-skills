import argparse
import json
from pathlib import Path


LIMITS = {
    "x_growth": 30,
    "lofter_activity": 30,
    "ip_match": 15,
    "authorization": 15,
    "story_potential": 10,
}
VALID_IP_SLOTS = {"long_term", "rising", "experiment"}


def score_candidate(candidate: dict) -> dict:
    required = {"id", "title", "ip_slot", *LIMITS.keys()}
    missing = sorted(required - candidate.keys())
    if missing:
        raise ValueError(f"missing fields: {', '.join(missing)}")
    if candidate["ip_slot"] not in VALID_IP_SLOTS:
        raise ValueError("ip_slot must be long_term, rising, or experiment")
    for field, maximum in LIMITS.items():
        value = candidate[field]
        if not isinstance(value, int) or isinstance(value, bool):
            raise ValueError(f"{field} must be an integer")
        if not 0 <= value <= maximum:
            raise ValueError(f"{field} must be between 0 and {maximum}")
    total = sum(candidate[field] for field in LIMITS)
    return {
        **candidate,
        "total_score": total,
        "eligible": total >= 70,
        "media_instruction": (
            "use_authorized_media"
            if candidate["authorization"] > 0
            else "create_independent_image"
        ),
    }


def rank_candidates(candidates: list[dict], threshold: int = 70) -> list[dict]:
    scored = [score_candidate(candidate) for candidate in candidates]
    return sorted(
        (item for item in scored if item["total_score"] >= threshold),
        key=lambda item: (-item["total_score"], item["id"]),
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    candidates = json.loads(args.input.read_text(encoding="utf-8"))
    result = rank_candidates(candidates)
    payload = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.write_text(payload, encoding="utf-8")
    else:
        print(payload, end="")


if __name__ == "__main__":
    main()

import argparse
import json
from pathlib import Path


REQUIRED = {
    "asset_id",
    "author_handle",
    "source_url",
    "evidence_path",
    "lofter_redistribution",
    "ai_adaptation",
    "commercial_use",
}


def validate_authorization(record: dict, usage: str, commercial: bool = False) -> dict:
    missing = sorted(REQUIRED - record.keys())
    if missing:
        raise ValueError(f"missing fields: {', '.join(missing)}")
    if usage not in {"original", "ai_adaptation"}:
        raise ValueError("usage must be original or ai_adaptation")
    if not record["lofter_redistribution"]:
        raise ValueError("LOFTER redistribution is not authorized")
    if usage == "ai_adaptation" and not record["ai_adaptation"]:
        raise ValueError("AI adaptation is not authorized")
    if commercial and not record["commercial_use"]:
        raise ValueError("commercial use is not authorized")
    return {
        "asset_id": record["asset_id"],
        "allowed": True,
        "usage": usage,
        "commercial": commercial,
        "author_handle": record["author_handle"],
        "source_url": record["source_url"],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("ledger", type=Path)
    parser.add_argument("asset_id")
    parser.add_argument("--usage", choices=("original", "ai_adaptation"), required=True)
    parser.add_argument("--commercial", action="store_true")
    args = parser.parse_args()
    records = json.loads(args.ledger.read_text(encoding="utf-8"))
    matches = [record for record in records if record.get("asset_id") == args.asset_id]
    if len(matches) != 1:
        raise SystemExit(f"expected one authorization record for {args.asset_id}")
    result = validate_authorization(matches[0], args.usage, args.commercial)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

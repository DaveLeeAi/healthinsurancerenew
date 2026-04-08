"""
classify_drugs.py

Bulk-classify every drug in drug_national_baselines.json into a DrugArchetype.
Output: data/processed/drug_classifications.json

Mirrors the TypeScript logic in lib/drug-archetype.ts exactly.
"""

import json
import statistics
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASELINE_PATH = ROOT / "data" / "processed" / "drug_national_baselines.json"
OUTPUT_PATH = ROOT / "data" / "processed" / "drug_classifications.json"

# ── Name lists (must mirror lib/drug-archetype.ts) ──────────────────────────

GLP1_NAMES = [
    "ozempic", "wegovy", "mounjaro", "rybelsus", "trulicity", "saxenda",
    "victoza", "byetta", "bydureon", "zepbound",
    "semaglutide", "liraglutide", "tirzepatide", "dulaglutide", "exenatide",
]

STATIN_NAMES = [
    "atorvastatin", "rosuvastatin", "simvastatin", "pravastatin",
    "lovastatin", "fluvastatin", "pitavastatin",
    "lipitor", "crestor", "zocor", "pravachol", "mevacor", "livalo",
]

CONTROLLED_NAMES = [
    "amphetamine", "dextroamphetamine", "adderall",
    "methylphenidate", "ritalin", "concerta", "focalin", "metadate",
    "vyvanse", "lisdexamfetamine",
    "alprazolam", "xanax", "diazepam", "valium",
    "clonazepam", "klonopin", "lorazepam", "ativan", "temazepam",
    "zolpidem", "ambien", "eszopiclone", "lunesta", "zaleplon",
    "oxycodone", "oxycontin", "percocet", "hydrocodone", "vicodin",
    "tramadol", "codeine", "morphine", "fentanyl", "methadone", "buprenorphine",
    "gabapentin", "pregabalin", "lyrica", "neurontin",
    "modafinil", "armodafinil", "provigil", "nuvigil",
]

MENTAL_HEALTH_NAMES = [
    "sertraline", "fluoxetine", "escitalopram", "citalopram", "paroxetine",
    "venlafaxine", "duloxetine", "desvenlafaxine", "levomilnacipran",
    "bupropion", "mirtazapine", "trazodone", "vilazodone", "vortioxetine",
    "zoloft", "lexapro", "prozac", "celexa", "paxil",
    "effexor", "cymbalta", "pristiq", "wellbutrin", "remeron",
    "aripiprazole", "quetiapine", "olanzapine", "risperidone", "ziprasidone",
    "lurasidone", "paliperidone", "clozapine", "haloperidol",
    "abilify", "seroquel", "zyprexa", "risperdal", "latuda",
    "lamotrigine", "lithium", "lamictal",
    "amitriptyline", "nortriptyline", "imipramine", "doxepin",
    "buspirone", "buspar",
]

INHALER_NAMES = [
    "albuterol", "levalbuterol", "budesonide", "fluticasone", "mometasone",
    "beclomethasone", "ciclesonide",
    "symbicort", "advair", "breo", "dulera", "wixela",
    "montelukast", "singulair",
    "proair", "ventolin", "proventil", "xopenex",
    "ipratropium", "tiotropium", "spiriva", "umeclidinium", "incruse",
    "trelegy", "anoro", "stiolto",
    "pulmicort", "qvar", "flovent", "arnuity", "asmanex",
    "formoterol", "salmeterol", "arformoterol",
]

THYROID_NAMES = [
    "levothyroxine", "synthroid", "levoxyl", "unithroid", "tirosint",
    "liothyronine", "cytomel",
    "armour thyroid", "np thyroid", "nature-throid",
    "methimazole", "tapazole", "propylthiouracil",
]

ACUTE_NAMES = [
    "amoxicillin", "amoxicillin-clavulanate", "augmentin",
    "azithromycin", "zithromax", "z-pak",
    "cephalexin", "keflex", "cefdinir", "cefuroxime", "cefpodoxime",
    "ciprofloxacin", "cipro", "levofloxacin", "levaquin", "moxifloxacin",
    "doxycycline", "minocycline", "tetracycline",
    "clindamycin", "cleocin",
    "metronidazole", "flagyl",
    "sulfamethoxazole", "trimethoprim", "bactrim",
    "nitrofurantoin", "macrobid", "macrodantin",
    "penicillin", "ampicillin",
    "fluconazole", "diflucan",
    "acyclovir", "valacyclovir", "valtrex",
    "oseltamivir", "tamiflu",
]

# ── Helpers ─────────────────────────────────────────────────────────────────

def name_matches(drug_name, names):
    n = drug_name.lower().strip()
    return any(n == needle or needle in n for needle in names)


def normalize_tier(tier):
    t = tier.lower().replace("_", "-")
    if "specialty" in t:
        return "specialty"
    if "non-preferred" in t:
        return "non-preferred-brand"
    if "preferred-brand" in t or "preferred-brands" in t:
        return "preferred-brand"
    if "generic" in t and "brand" not in t:
        return "generic"
    return t


def base_profile(archetype, tier, **opts):
    return {
        "archetype": archetype,
        "isGeneric": opts.get("isGeneric", tier == "generic"),
        "isBrand": opts.get("isBrand", "brand" in tier),
        "isSpecialty": opts.get("isSpecialty", tier == "specialty"),
        "isInjectable": opts.get("isInjectable", False),
        "isControlled": opts.get("isControlled", False),
        "isInsulin": opts.get("isInsulin", False),
        "chronicOrAcute": opts.get("chronicOrAcute", "both"),
        "typicalFriction": opts.get("typicalFriction", "moderate"),
        "costSensitivity": opts.get("costSensitivity", "moderate"),
        "quantityLimitLikelihood": opts.get("qlLikelihood", "moderate"),
    }


def classify_drug(drug_name, dominant_tier, national_pa_pct, national_ql_pct,
                  total_plans, median_total_plans):
    name = drug_name.lower().strip()
    tier = normalize_tier(dominant_tier or "")

    # 1 — Insulin
    if "insulin" in name:
        return base_profile("injectable-diabetes", tier,
            isInjectable=True, isInsulin=True, chronicOrAcute="chronic",
            typicalFriction="low", costSensitivity="low", qlLikelihood="high")

    # 2 — GLP-1
    if name_matches(name, GLP1_NAMES):
        return base_profile("glp1-weight-diabetes", tier,
            isInjectable="rybelsus" not in name, chronicOrAcute="chronic",
            typicalFriction="high", costSensitivity="high", qlLikelihood="high")

    # 3 — Statin
    if name_matches(name, STATIN_NAMES):
        return base_profile("statin-cholesterol", tier,
            chronicOrAcute="chronic", typicalFriction="low",
            costSensitivity="low", qlLikelihood="low")

    # 4 — Controlled
    if name_matches(name, CONTROLLED_NAMES):
        return base_profile("controlled-substance", tier,
            isControlled=True, chronicOrAcute="both",
            typicalFriction="moderate", costSensitivity="moderate", qlLikelihood="high")

    # 5 — Mental health
    if name_matches(name, MENTAL_HEALTH_NAMES):
        return base_profile("mental-health", tier,
            chronicOrAcute="chronic", typicalFriction="low",
            costSensitivity="low", qlLikelihood="moderate")

    # 6 — Inhaler
    if name_matches(name, INHALER_NAMES):
        return base_profile("inhaler-respiratory", tier,
            chronicOrAcute="chronic", typicalFriction="moderate",
            costSensitivity="moderate", qlLikelihood="moderate")

    # 7 — Thyroid
    if name_matches(name, THYROID_NAMES):
        return base_profile("thyroid-hormone", tier,
            chronicOrAcute="chronic", typicalFriction="low",
            costSensitivity="low", qlLikelihood="low")

    # 8 — Specialty biologic (signal-driven)
    if tier == "specialty" and national_pa_pct > 50 and total_plans < median_total_plans:
        return base_profile("specialty-biologic", tier,
            isSpecialty=True, chronicOrAcute="chronic",
            typicalFriction="high", costSensitivity="high", qlLikelihood="high")

    if tier == "specialty" and national_pa_pct > 70:
        return base_profile("specialty-biologic", tier,
            isSpecialty=True, chronicOrAcute="chronic",
            typicalFriction="high", costSensitivity="high", qlLikelihood="high")

    # 9 — Brand chronic
    if tier in ("preferred-brand", "non-preferred-brand") and national_pa_pct > 30:
        return base_profile("brand-chronic", tier,
            isBrand=True, chronicOrAcute="chronic",
            typicalFriction="moderate", costSensitivity="high", qlLikelihood="moderate")

    # 10 — Common generic acute
    if (tier == "generic" and national_pa_pct < 20
            and total_plans > median_total_plans * 1.5
            and name_matches(name, ACUTE_NAMES)):
        return base_profile("common-generic-acute", tier,
            isGeneric=True, chronicOrAcute="acute",
            typicalFriction="low", costSensitivity="low", qlLikelihood="low")

    # 11 — Common generic chronic
    if tier == "generic" and total_plans > median_total_plans:
        return base_profile("common-generic-chronic", tier,
            isGeneric=True, chronicOrAcute="chronic",
            typicalFriction="low", costSensitivity="low", qlLikelihood="low")

    # 12 — Other
    return base_profile("other", tier,
        isGeneric=tier == "generic",
        isBrand="brand" in tier,
        isSpecialty=tier == "specialty",
        chronicOrAcute="both",
        typicalFriction="high" if national_pa_pct > 50 else "moderate" if national_pa_pct > 20 else "low",
        costSensitivity="high" if tier == "specialty" else "low" if tier == "generic" else "moderate",
        qlLikelihood="high" if national_ql_pct > 60 else "moderate" if national_ql_pct > 30 else "low",
    )


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    print(f"Reading {BASELINE_PATH}...")
    with open(BASELINE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    raw = data.get("data", data)
    print(f"Loaded {len(raw)} drugs")

    plan_counts = sorted(e["total_plans_national"] for e in raw.values())
    median_plans = statistics.median(plan_counts)
    print(f"Median total_plans_national: {median_plans}")

    classifications = {}
    for drug_name, entry in raw.items():
        cls = classify_drug(
            drug_name=drug_name,
            dominant_tier=entry.get("dominant_tier_national", ""),
            national_pa_pct=float(entry.get("prior_auth_pct_national", 0) or 0),
            national_ql_pct=float(entry.get("quantity_limit_pct_national", 0) or 0),
            total_plans=int(entry.get("total_plans_national", 0) or 0),
            median_total_plans=median_plans,
        )
        classifications[drug_name] = cls

    counter = Counter(c["archetype"] for c in classifications.values())
    print(f"\nClassified {len(classifications)} drugs:")
    for arch, count in counter.most_common():
        pct = count * 100 / len(classifications)
        print(f"  {arch}: {count} ({pct:.1f}%)")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(classifications, f, indent=2)
    print(f"\nWrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

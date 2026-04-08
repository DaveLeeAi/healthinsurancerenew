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

# ── New archetype name lists (must mirror lib/drug-archetype.ts) ─────────────

ANTICOAGULANT_NAMES = [
    "warfarin", "coumadin", "jantoven",
    "heparin", "enoxaparin", "lovenox", "dalteparin", "fragmin",
    "fondaparinux", "arixtra",
    "rivaroxaban", "xarelto",
    "apixaban", "eliquis",
    "dabigatran", "pradaxa",
    "edoxaban", "savaysa", "lixiana",
    "betrixaban", "bevyxxa",
]

CONTRACEPTIVE_NAMES = [
    "ethinyl-estradiol", "ethinyl estradiol",
    "norethindrone", "norgestimate", "norgestrel", "norelgestromin",
    "levonorgestrel", "desogestrel", "drospirenone", "etonogestrel",
    "medroxyprogesterone", "depo-provera", "depo-subq",
    "segesterone", "ulipristal",
    "sprintec", "tri-sprintec", "mononessa", "tri-previfem", "previfem",
    "ortho-cyclen", "ortho-tri-cyclen", "ortho-novum", "ortho-evra",
    "yasmin", "yaz", "beyaz", "gianvi", "loryna", "syeda", "ocella",
    "loestrin", "lo loestrin", "junel", "microgestin",
    "lutera", "lessina", "aviane", "orsythia", "sronyx",
    "seasonique", "lo seasonique", "amethia", "camrese", "daysee",
    "kariva", "mircette", "azurette",
    "estarylla", "estradiol-norethindrone",
    "jolessa", "introvale", "quartette",
    "nuvaring", "eluryng", "annovera", "xulane", "twirla",
    "nexplanon", "implanon",
    "mirena", "kyleena", "skyla", "liletta",
    "plan b", "plan-b", "ella",
]

OPHTHALMIC_NAMES = [
    "latanoprost", "xalatan", "travoprost", "travatan", "bimatoprost", "lumigan",
    "tafluprost", "zioptan", "latanoprostene", "vyzulta",
    "brimonidine", "alphagan", "apraclonidine", "iopidine",
    "timolol-mal", "timolol maleate", "betaxolol", "betoptic",
    "levobunolol", "betagan", "carteolol", "metipranolol",
    "dorzolamide", "trusopt", "brinzolamide", "azopt",
    "cosopt", "combigan", "simbrinza", "rocklatan", "netarsudil",
    "pilocarpine", "isopto carpine",
    "cyclosporine ophthalmic", "restasis", "cequa",
    "lifitegrast", "xiidra", "varenicline ophthalmic", "tyrvaya",
    "perfluorohexyloctane", "miebo",
    "olopatadine", "patanol", "pataday", "pazeo",
    "ketotifen ophthalmic", "alaway", "zaditor",
    "azelastine ophthalmic", "optivar",
    "epinastine", "elestat", "bepotastine", "bepreve",
    "moxifloxacin ophthalmic", "vigamox", "gatifloxacin ophthalmic", "zymaxid",
    "besifloxacin", "besivance",
    "difluprednate", "durezol", "loteprednol", "lotemax", "alrex",
    "bromfenac", "prolensa", "nepafenac", "nevanac", "ilevro",
]

DERMATOLOGY_TOPICAL_NAMES = [
    "clobetasol", "temovate", "olux", "cormax", "clodan", "impeklo",
    "halobetasol", "ultravate", "lexette", "bryhali",
    "betamethasone-dip", "betamethasone dipropionate", "diprolene", "diprosone",
    "augmented betamethasone", "sernivo",
    "fluocinonide", "lidex", "vanos",
    "halcinonide", "halog",
    "amcinonide", "cyclocort",
    "desoximetasone", "topicort",
    "mometasone topical", "mometasone furoate cream", "elocon",
    "fluticasone topical", "cutivate",
    "triamcinolone topical", "triamcinolone acetonide cream", "kenalog cream",
    "hydrocortisone", "cortizone", "cortaid", "westcort", "locoid",
    "desonide", "desowen", "verdeso", "tridesilon",
    "alclometasone", "aclovate",
    "prednicarbate", "dermatop",
    "fluocinolone", "capex", "derma-smoothe", "synalar",
    "tretinoin", "retin-a", "renova", "avita", "altreno", "atralin",
    "adapalene", "differin", "epiduo",
    "tazarotene", "tazorac", "arazlo", "fabior",
    "trifarotene", "aklief",
    "isotretinoin", "accutane", "absorica", "claravis", "amnesteem", "myorisan",
    "tacrolimus topical", "protopic",
    "pimecrolimus", "elidel",
    "crisaborole", "eucrisa",
    "ruxolitinib topical", "opzelura",
    "calcipotriene", "dovonex", "sorilux", "enstilar", "taclonex",
    "calcitriol topical", "vectical",
    "anthralin", "dritho-creme",
    "mupirocin", "bactroban", "centany",
    "retapamulin", "altabax",
    "metronidazole topical", "metrogel", "metrocream", "noritate", "rosadan",
    "azelaic acid", "finacea", "azelex",
    "clindamycin topical", "cleocin t", "clindagel", "evoclin",
    "erythromycin topical", "erygel",
    "dapsone topical", "aczone",
    "sulfacetamide topical", "klaron",
    "minocycline topical", "amzeeq", "zilxi",
    "ketoconazole topical", "nizoral cream", "extina", "xolegel",
    "ciclopirox", "loprox", "penlac",
    "econazole", "spectazole", "ecoza",
    "oxiconazole", "oxistat",
    "sulconazole", "exelderm",
    "naftifine", "naftin",
    "butenafine", "mentax",
    "imiquimod", "aldara", "zyclara",
    "podofilox", "condylox",
    "sinecatechins", "veregen",
    "permethrin", "elimite", "nix", "acticin",
    "lindane",
    "spinosad", "natroba",
    "ivermectin topical", "sklice", "soolantra",
    "malathion", "ovide",
    "benzoyl peroxide", "epiduo forte", "duac", "benzaclin",
    "fluorouracil topical", "efudex", "carac", "tolak", "fluoroplex",
    "glycopyrronium topical", "qbrexza",
    "eflornithine", "vaniqa",
    "hydroquinone", "tri-luma",
    "selenium sulfide", "selsun", "selrx",
    "salicylic acid topical", "salex",
    "urea topical", "kerafoam", "umecta", "rea lo",
    "lactic acid topical", "lac-hydrin", "amlactin",
    "pramoxine topical",
    "lidocaine topical", "lidoderm", "zingo",
    "capsaicin topical",
    "doxepin topical", "prudoxin", "zonalon",
]

# ── Helpers ─────────────────────────────────────────────────────────────────

def name_matches(drug_name, names):
    """
    Match drug_name against a list of needles.

    For needles >= 5 chars, plain substring matching is used.
    For shorter needles, the match must be word-bounded so that 'ella'
    (the contraceptive ulipristal) does NOT match 'savella', 'bordetella',
    'ocella', etc., and 'yaz' does not match 'dyazide'.
    """
    n = drug_name.lower().strip()
    for needle in names:
        if n == needle:
            return True
        idx = n.find(needle)
        if idx == -1:
            continue
        if len(needle) >= 5:
            return True
        # Short needle: require non-alphanumeric on both sides
        before_ok = idx == 0 or not n[idx - 1].isalnum()
        end = idx + len(needle)
        after_ok = end == len(n) or not n[end].isalnum()
        if before_ok and after_ok:
            return True
    return False


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

    # 8 — Anticoagulant (DOACs + warfarin)
    if name_matches(name, ANTICOAGULANT_NAMES):
        return base_profile("anticoagulant", tier,
            isBrand=tier != "generic",
            chronicOrAcute="chronic", typicalFriction="moderate",
            costSensitivity="low" if tier == "generic" else "high",
            qlLikelihood="low")

    # 9 — Contraceptive (oral/ring/patch/implant/hormonal IUD)
    if name_matches(name, CONTRACEPTIVE_NAMES):
        return base_profile("contraceptive", tier,
            chronicOrAcute="chronic", typicalFriction="low",
            costSensitivity="low",  # ACA $0 mandate
            qlLikelihood="low")

    # 10 — Ophthalmic (eye drops, gels, suspensions)
    if name_matches(name, OPHTHALMIC_NAMES):
        return base_profile("ophthalmic", tier,
            chronicOrAcute="chronic", typicalFriction="low",
            costSensitivity="high" if tier == "specialty" else "low",
            qlLikelihood="low")

    # 11 — Dermatology topical (non-specialty only — biologics stay in specialty)
    if tier != "specialty" and name_matches(name, DERMATOLOGY_TOPICAL_NAMES):
        return base_profile("dermatology", tier,
            chronicOrAcute="both", typicalFriction="low",
            costSensitivity="low", qlLikelihood="low")

    # 12 — Specialty biologic (signal-driven)
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

"""
County FIPS codes for states that use CoverEntireState=Yes in the CMS Service Area PUF
without listing individual county rows.

These states have statewide service areas — all counties are covered but none are enumerated.
We supply the FIPS codes here so the ETL can expand statewide coverage to county-level records.

Source: US Census Bureau FIPS State and County Codes
"""

# State FIPS → list of 5-digit county FIPS codes (state FIPS prefix + 3-digit county code)
COVER_ENTIRE_STATE_COUNTIES: dict[str, list[str]] = {
    # Arkansas (State FIPS 05) — 75 counties
    "AR": [
        "05001", "05003", "05005", "05007", "05009", "05011", "05013", "05015",
        "05017", "05019", "05021", "05023", "05025", "05027", "05029", "05031",
        "05033", "05035", "05037", "05039", "05041", "05043", "05045", "05047",
        "05049", "05051", "05053", "05055", "05057", "05059", "05061", "05063",
        "05065", "05067", "05069", "05071", "05073", "05075", "05077", "05079",
        "05081", "05083", "05085", "05087", "05089", "05091", "05093", "05095",
        "05097", "05099", "05101", "05103", "05105", "05107", "05109", "05111",
        "05113", "05115", "05117", "05119", "05121", "05123", "05125", "05127",
        "05129", "05131", "05133", "05135", "05137", "05139", "05141", "05143",
        "05145", "05147", "05149",
    ],
    # Delaware (State FIPS 10) — 3 counties
    "DE": ["10001", "10003", "10005"],
    # Hawaii (State FIPS 15) — 5 counties (4 main + Kalawao)
    "HI": ["15001", "15003", "15005", "15007", "15009"],
    # West Virginia (State FIPS 54) — 55 counties
    "WV": [
        "54001", "54003", "54005", "54007", "54009", "54011", "54013", "54015",
        "54017", "54019", "54021", "54023", "54025", "54027", "54029", "54031",
        "54033", "54035", "54037", "54039", "54041", "54043", "54045", "54047",
        "54049", "54051", "54053", "54055", "54057", "54059", "54061", "54063",
        "54065", "54067", "54069", "54071", "54073", "54075", "54077", "54079",
        "54081", "54083", "54085", "54087", "54089", "54091", "54093", "54095",
        "54097", "54099", "54101", "54103", "54105", "54107", "54109",
    ],
}

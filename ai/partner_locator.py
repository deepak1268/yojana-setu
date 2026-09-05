"""
Geo-Spatial Partner Locator & Router Prototype
----------------------------------------------
A standalone Python prototype for filtering, distance calculation,
and multi-factor ranking of channel partners for government schemes.

Integrated with the AI Scheme Matcher to automatically consume the
highest-ranked recommended scheme_id.
"""

import json
import math
import os
import random
from scheme_matcher import match_schemes, SchemeAgent

# Configurable Risk & Utilization Thresholds
MAX_FUND_UTILIZATION = 85.0
MAX_NPA = 7.0
MAX_OVERDUE = 10.0

# Configurable Scoring Weights
WEIGHT_DISTANCE = 0.40
WEIGHT_FUND = 0.25
WEIGHT_NPA = 0.15
WEIGHT_OVERDUE = 0.10
WEIGHT_CAPACITY = 0.10

PARTNERS_FILE = "partners.json"
SCHEMES_FILE = "schemes.json"


def generate_dummy_partners(schemes_filepath=SCHEMES_FILE):
    """
    Generates approximately 120-140 realistic dummy channel partners distributed
    across Indian states and cities with varied financial metrics and locations.
    Incorporates actual scheme_ids from schemes.json into supported_schemes.
    """
    city_data = [
        # (State, City, Lat, Lon)
        ("Delhi", "New Delhi", 28.6139, 77.2090),
        ("Haryana", "Gurugram", 28.4595, 77.0266),
        ("Haryana", "Faridabad", 28.4089, 77.3178),
        ("Uttar Pradesh", "Noida", 28.5355, 77.3910),
        ("Uttar Pradesh", "Lucknow", 26.8467, 80.9462),
        ("Uttar Pradesh", "Kanpur", 26.4499, 80.3319),
        ("Rajasthan", "Jaipur", 26.9124, 75.7873),
        ("Rajasthan", "Jodhpur", 26.2389, 73.0243),
        ("Punjab", "Chandigarh", 30.7333, 76.7794),
        ("Punjab", "Ludhiana", 30.9010, 75.8573),
        ("Maharashtra", "Mumbai", 19.0760, 72.8777),
        ("Maharashtra", "Pune", 18.5204, 73.8567),
        ("Maharashtra", "Nagpur", 21.1458, 79.0882),
        ("Gujarat", "Ahmedabad", 23.0225, 72.5714),
        ("Gujarat", "Surat", 21.1702, 72.8311),
        ("Madhya Pradesh", "Bhopal", 23.2599, 77.4126),
        ("Madhya Pradesh", "Indore", 22.7196, 75.8577),
        ("Bihar", "Patna", 25.5941, 85.1376),
        ("Bihar", "Gaya", 24.7955, 85.0002),
        ("Jharkhand", "Ranchi", 23.3441, 85.3096),
        ("Jharkhand", "Jamshedpur", 22.8046, 86.2029),
        ("West Bengal", "Kolkata", 22.5726, 88.3639),
        ("West Bengal", "Siliguri", 26.7271, 88.3953),
        ("Odisha", "Bhubaneswar", 20.2961, 85.8245),
        ("Odisha", "Cuttack", 20.4625, 85.8828),
        ("Karnataka", "Bengaluru", 12.9716, 77.5946),
        ("Karnataka", "Mysuru", 12.2958, 76.6394),
        ("Tamil Nadu", "Chennai", 13.0827, 80.2707),
        ("Tamil Nadu", "Coimbatore", 11.0168, 76.9558),
        ("Telangana", "Hyderabad", 17.3850, 78.4867),
        ("Telangana", "Warangal", 17.9784, 79.5941),
        ("Andhra Pradesh", "Vijayawada", 16.5062, 80.6480),
        ("Andhra Pradesh", "Visakhapatnam", 17.6868, 83.2185),
        ("Kerala", "Thiruvananthapuram", 8.5241, 76.9366),
        ("Kerala", "Kochi", 9.9312, 76.2673),
        ("Assam", "Guwahati", 26.1445, 91.7362),
        ("Chhattisgarh", "Raipur", 21.2514, 81.6296),
        ("Uttarakhand", "Dehradun", 30.3165, 78.0322),
    ]

    partner_types = ["SCA", "PSB", "RRB", "NBFC-MFI"]
    type_name_templates = {
        "SCA": "{state} State Channelizing Agency",
        "PSB": "State Bank Partner - {city}",
        "RRB": "{state} Regional Rural Bank - {city} Branch",
        "NBFC-MFI": "Gramin Microfinance Partner - {city}",
    }

    # Load scheme_ids from schemes.json if available
    scheme_pool = ["MFS", "TL", "EDL", "MUKHYAMANTRI_SCHEME"]
    if os.path.exists(schemes_filepath):
        try:
            with open(schemes_filepath, "r", encoding="utf-8") as f:
                s_data = json.load(f)
                real_ids = [s.get("scheme_id") for s in s_data if s.get("scheme_id")]
                if real_ids:
                    scheme_pool.extend(real_ids)
        except Exception:
            pass

    random.seed(42)  # Deterministic seed for reproducible dummy dataset
    partners = []
    pid = 1

    # Distribute schemes across partners so every scheme has supporting partners
    total_schemes = len(scheme_pool)

    for state, city, base_lat, base_lon in city_data:
        num_partners = random.randint(3, 4)
        for i in range(num_partners):
            ptype = partner_types[i % len(partner_types)]
            lat_offset = round(random.uniform(-0.05, 0.05), 4)
            lon_offset = round(random.uniform(-0.05, 0.05), 4)

            # Each partner supports a cluster of schemes + common key schemes
            start_idx = (pid * 25) % total_schemes
            cluster_schemes = set(scheme_pool[start_idx : start_idx + 50])
            common_schemes = set(random.sample(scheme_pool, min(30, total_schemes)))
            supported = cluster_schemes.union(common_schemes)

            active = random.random() > 0.05  # ~95% active partners
            fund_util = round(random.uniform(35.0, 82.0), 1)  # Most under MAX_FUND_UTILIZATION (85%)
            npa = round(random.uniform(0.5, 6.5), 1)         # Most under MAX_NPA (7%)
            overdue = round(random.uniform(1.0, 9.0), 1)      # Most under MAX_OVERDUE (10%)
            capacity = random.choice(["high", "medium", "low"])

            name = type_name_templates[ptype].format(state=state, city=city)

            partner = {
                "partner_id": f"P{pid:03d}",
                "name": name,
                "type": ptype,
                "state": state,
                "city": city,
                "latitude": round(base_lat + lat_offset, 4),
                "longitude": round(base_lon + lon_offset, 4),
                "supported_schemes": sorted(list(supported)),
                "active": active,
                "fund_utilization_percent": fund_util,
                "npa_percent": npa,
                "overdue_percent": overdue,
                "processing_capacity": capacity,
            }
            partners.append(partner)
            pid += 1


    return partners


def save_partners(partners, filename=PARTNERS_FILE):
    """Saves partners list to JSON file."""
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(partners, f, indent=4, ensure_ascii=False)


def load_partners(filename=PARTNERS_FILE):
    """Loads partners from JSON file. Generates dummy dataset if file missing."""
    if not os.path.exists(filename):
        partners = generate_dummy_partners()
        save_partners(partners, filename)
        return partners

    with open(filename, "r", encoding="utf-8") as f:
        return json.load(f)


def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculates Haversine distance in kilometers between two coordinates.
    """
    R = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2.0) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def check_partner_eligibility(partner, selected_scheme_id):
    """
    Checks if a partner is active, supports the scheme, and meets risk/utilization thresholds.
    """
    if not partner.get("active", False):
        return False
    if selected_scheme_id not in partner.get("supported_schemes", []):
        return False
    if partner.get("fund_utilization_percent", 100) >= MAX_FUND_UTILIZATION:
        return False
    if partner.get("npa_percent", 100) >= MAX_NPA:
        return False
    if partner.get("overdue_percent", 100) >= MAX_OVERDUE:
        return False
    return True


def calculate_distance_score(distance, min_dist, max_dist):
    """Normalized score where smaller distance is better (1.0 = closest, 0.0 = farthest)."""
    if max_dist == min_dist:
        return 1.0
    score = 1.0 - (distance - min_dist) / (max_dist - min_dist)
    return max(0.0, min(1.0, score))


def calculate_fund_score(fund_utilization_percent):
    """Normalized score where lower utilization % is better."""
    score = 1.0 - (fund_utilization_percent / MAX_FUND_UTILIZATION)
    return max(0.0, min(1.0, score))


def calculate_npa_score(npa_percent):
    """Normalized score where lower NPA % is better."""
    score = 1.0 - (npa_percent / MAX_NPA)
    return max(0.0, min(1.0, score))


def calculate_overdue_score(overdue_percent):
    """Normalized score where lower overdue % is better."""
    score = 1.0 - (overdue_percent / MAX_OVERDUE)
    return max(0.0, min(1.0, score))


def calculate_capacity_score(capacity):
    """Score for processing capacity: high -> 1.0, medium -> 0.6, low -> 0.3."""
    cap_map = {"high": 1.0, "medium": 0.6, "low": 0.3}
    return cap_map.get(str(capacity).lower(), 0.5)


def calculate_routing_score(dist_score, fund_score, npa_score, overdue_score, capacity_score):
    """Calculates weighted composite routing score."""
    return (
        dist_score * WEIGHT_DISTANCE
        + fund_score * WEIGHT_FUND
        + npa_score * WEIGHT_NPA
        + overdue_score * WEIGHT_OVERDUE
        + capacity_score * WEIGHT_CAPACITY
    )


def rank_partners(eligible_partners, user_lat, user_lon):
    """
    Ranks eligible partners based on distance and financial performance metrics.
    """
    if not eligible_partners:
        return []

    partner_distances = []
    for p in eligible_partners:
        d = calculate_distance(user_lat, user_lon, p["latitude"], p["longitude"])
        partner_distances.append((p, d))

    distances = [d for _, d in partner_distances]
    min_dist = min(distances)
    max_dist = max(distances)

    scored_partners = []
    for p, d in partner_distances:
        d_score = calculate_distance_score(d, min_dist, max_dist)
        f_score = calculate_fund_score(p.get("fund_utilization_percent", 0))
        n_score = calculate_npa_score(p.get("npa_percent", 0))
        o_score = calculate_overdue_score(p.get("overdue_percent", 0))
        c_score = calculate_capacity_score(p.get("processing_capacity", "medium"))

        total_score = calculate_routing_score(d_score, f_score, n_score, o_score, c_score)

        partner_copy = dict(p)
        partner_copy["_routing_score"] = total_score
        partner_copy["_distance_km"] = d
        scored_partners.append(partner_copy)

    scored_partners.sort(key=lambda x: x["_routing_score"], reverse=True)
    return scored_partners


def get_top_partners(selected_scheme_id, user_lat, user_lon, partners):
    """
    Filters, ranks, and returns top 3 eligible partners for the given scheme ID and location.
    """
    eligible = [p for p in partners if check_partner_eligibility(p, selected_scheme_id)]
    if not eligible:
        return []

    ranked = rank_partners(eligible, user_lat, user_lon)
    return ranked[:3]


def display_top_3(top_partners):
    """
    Displays ONLY the top recommended partners without exposing internal financial/routing metrics.
    """
    print()
    if not top_partners:
        print("No eligible channel partner found.")
        return

    print("Top Channel Partners:")
    print()
    for idx, partner in enumerate(top_partners, 1):
        print(f"{idx}. {partner['name']}")


def main():
    """
    Main entry point for standalone prototype.
    Consumes selected_scheme_id directly from the AI Scheme Matcher output.
    """

    # 1. Load schemes knowledge base and user profile
    schemes_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), SCHEMES_FILE)
    if os.path.exists(schemes_path):
        with open(schemes_path, "r", encoding="utf-8") as f:
            schemes = json.load(f)
    else:
        schemes = []

    # Sample user profile evaluated by AI Scheme Matcher
    user = {
        "category": "SC",
        "gender": "male",
        "age": 25,
        "annual_income": 300000,
        "state": "Delhi",
        "district": "New Delhi",
        "occupation": "self_employed",
        "education": "graduate",
        "purpose": "business",
        "project_type": "micro_business",
        "project_cost": 100000,
        "loan_required": 90000,
    }

    # 2. Existing AI Scheme Matcher evaluates applicant and produces recommendations
    recommendations, _ = match_schemes(user, schemes)

    if not recommendations:
        print("No eligible government scheme recommendations found for applicant.")
        return

    # 3. Extract highest-ranked / first recommended scheme_id from AI Matcher output
    selected_scheme_id = recommendations[0]["scheme_id"]

    # Regenerate/load partners to ensure scheme_id compatibility
    partners = generate_dummy_partners(schemes_path)
    save_partners(partners, PARTNERS_FILE)

    # 4. Ask user ONLY for location (latitude & longitude)
    try:
        user_lat = float(input("Enter your latitude: "))
        user_lon = float(input("Enter your longitude: "))
    except ValueError:
        print("Invalid latitude/longitude input.")
        return

    # 5. Find top 3 channel partners supporting the AI-selected scheme_id
    top_3 = get_top_partners(selected_scheme_id, user_lat, user_lon, partners)

    # 6. Display output
    display_top_3(top_3)


if __name__ == "__main__":
    main()

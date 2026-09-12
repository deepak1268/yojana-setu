"""
Comprehensive End-to-End Test Suite for YojnaSetu Features
-----------------------------------------------------------
Verifies:
1. Scheme Recommender endpoint (/schemes/match)
2. AI Chatbot endpoint (/schemes/chat) with varied follow-up questions
3. Financial Calculator catalog & filtering endpoint (/schemes)
4. EMI Calculation endpoint (/calculator/emi)
5. Partner Locator endpoint (/partners/locate) with multiple scheme IDs & dynamic coordinates
6. Edge case & empty state handling (no fake data)
"""

import sys
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_tests():
    print("=" * 60)
    print("RUNNING YOJNASETU INTEGRATION TESTS")
    print("=" * 60)

    test_user = {
        "category": "SC",
        "gender": "Male",
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

    # Test 1: Scheme Matching
    print("\n[TEST 1] Testing /schemes/match...")
    res1 = client.post("/schemes/match", json=test_user)
    assert res1.status_code == 200, f"Match failed: {res1.text}"
    data1 = res1.json()
    recs = data1.get("recommendations", [])
    assert len(recs) == 3, f"Expected 3 recommendations, got {len(recs)}"
    scheme_ids = [r["scheme_id"] for r in recs]
    print(f"  -> Successfully received top 3 recommended schemes: {scheme_ids}")

    # Test 2: AI Chatbot Endpoint with varied follow-up queries
    print("\n[TEST 2] Testing /schemes/chat follow-up questions...")
    test_questions = [
        "Why was this scheme recommended?",
        "What are the eligibility requirements?",
        "How much loan can I get?",
        "What is the interest rate?",
        "What documents are required?",
        "Which of the 3 schemes is better for me?",
        "Can I use this scheme for my purpose?",
    ]

    session_id = "test_chat_session_001"
    for q in test_questions:
        res2 = client.post("/schemes/chat", json={
            "session_id": session_id,
            "message": q,
            "scheme_ids": scheme_ids,
            "user_data": test_user,
        })
        assert res2.status_code == 200, f"Chat failed on '{q}': {res2.text}"
        data2 = res2.json()
        ans = data2.get("response", "")
        assert len(ans.strip()) > 0, f"Empty answer for '{q}'"
        print(f"  -> Q: '{q}' -> Response length: {len(ans)} chars")

    # Test 3: Complete Schemes Catalog & Filtering for Calculator
    print("\n[TEST 3] Testing /schemes catalog & filtering...")
    # Unfiltered
    res3_all = client.get("/schemes")
    assert res3_all.status_code == 200
    total_all = res3_all.json().get("total", 0)
    assert total_all > 1000, f"Expected >1000 schemes in catalog, got {total_all}"
    print(f"  -> Total available schemes in catalog: {total_all}")

    # Filtered by category
    res3_cat = client.get("/schemes?category=SC")
    assert res3_cat.status_code == 200
    total_cat = res3_cat.json().get("total", 0)
    assert 0 < total_cat <= total_all
    print(f"  -> Schemes matching Category='SC': {total_cat}")

    # Filtered by purpose
    res3_pur = client.get("/schemes?purpose=business")
    assert res3_pur.status_code == 200
    total_pur = res3_pur.json().get("total", 0)
    assert 0 < total_pur <= total_all
    print(f"  -> Schemes matching Purpose='business': {total_pur}")

    # Filtered by state
    res3_st = client.get("/schemes?state=Delhi")
    assert res3_st.status_code == 200
    total_st = res3_st.json().get("total", 0)
    assert 0 < total_st <= total_all
    print(f"  -> Schemes matching State='Delhi': {total_st}")

    # Search keyword
    res3_search = client.get("/schemes?search=micro")
    assert res3_search.status_code == 200
    total_search = res3_search.json().get("total", 0)
    print(f"  -> Schemes matching Search='micro': {total_search}")

    # Test 4: Financial Calculator EMI calculation
    print("\n[TEST 4] Testing /calculator/emi...")
    selected_scheme_id = scheme_ids[0]
    res4 = client.post("/calculator/emi", json={
        "scheme_id": selected_scheme_id,
        "loan_amount": 90000.0,
        "tenure_months": 36,
        "moratorium_months": 3,
    })
    assert res4.status_code == 200, f"EMI calculation failed: {res4.text}"
    data4 = res4.json()
    summary = data4.get("summary", {})
    schedule = data4.get("amortization_schedule", [])
    assert summary.get("monthly_emi", 0) > 0, "Expected positive monthly EMI"
    assert summary.get("total_interest", 0) > 0, "Expected positive total interest"
    assert len(schedule) == 36 + 3, f"Expected 39 months schedule, got {len(schedule)}"
    print(f"  -> Calculated EMI: Rs. {summary['monthly_emi']:.2f}, Total Interest: Rs. {summary['total_interest']:.2f}, Schedule rows: {len(schedule)} (36 repayment + 3 moratorium)")

    # Test 5: Partner Locator with Multi-Scheme IDs and Dynamic Coordinates
    print("\n[TEST 5] Testing /partners/locate with recommended scheme IDs and dynamic coordinates...")
    # Delhi coordinates
    res5_delhi = client.post("/partners/locate", json={
        "scheme_ids": scheme_ids,
        "latitude": 28.6139,
        "longitude": 77.2090,
    })
    assert res5_delhi.status_code == 200, f"Partner locator failed: {res5_delhi.text}"
    partners_delhi = res5_delhi.json().get("partners", [])
    assert len(partners_delhi) > 0, "Expected partners near Delhi"
    top_p = partners_delhi[0]
    assert "_routing_score" in top_p, "Expected _routing_score in ranked partner"
    assert "_distance_km" in top_p, "Expected _distance_km in ranked partner"
    print(f"  -> Found {len(partners_delhi)} partners near Delhi. Top partner: {top_p['name']} ({top_p['_distance_km']:.1f} km, score: {top_p['_routing_score']:.3f})")

    # Mumbai dynamic coordinates
    res5_mumbai = client.post("/partners/locate", json={
        "scheme_ids": scheme_ids,
        "latitude": 19.0760,
        "longitude": 72.8777,
    })
    assert res5_mumbai.status_code == 200
    partners_mumbai = res5_mumbai.json().get("partners", [])
    assert len(partners_mumbai) > 0, "Expected partners near Mumbai"
    print(f"  -> Dynamic coordinates (Mumbai): Top partner {partners_mumbai[0]['name']} ({partners_mumbai[0]['_distance_km']:.1f} km)")

    # Test 6: Empty state handling (no fake data)
    print("\n[TEST 6] Testing edge cases & empty states...")
    # Empty match request
    res6_empty = client.post("/schemes/match", json={"category": "NonExistentCategory123", "annual_income": 100})
    assert res6_empty.status_code == 200
    assert len(res6_empty.json().get("recommendations", [])) == 0
    print("  -> Empty match correctly returns 0 recommendations without mock data")

    # Empty schemes search
    res6_noschemes = client.get("/schemes?search=xyznonexistent987654321")
    assert res6_noschemes.status_code == 200
    assert res6_noschemes.json().get("total") == 0
    print("  -> Empty search correctly returns total: 0 without mock data")

    # Partner lookup for non-supported scheme
    res6_nopartners = client.post("/partners/locate", json={
        "scheme_ids": ["NON_EXISTENT_SCHEME_XYZ"],
        "latitude": 28.6139,
        "longitude": 77.2090,
    })
    assert res6_nopartners.status_code == 200
    assert len(res6_nopartners.json().get("partners", [])) == 0
    assert "No eligible channel partner found" in res6_nopartners.json().get("message", "")
    print("  -> Non-matching partners returns 0 partners with 'No eligible channel partner found'")

    print("\n" + "=" * 60)
    print("ALL 6 INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()

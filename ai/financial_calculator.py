"""
Financial Calculator Feature (Standalone Script)
Calculates loan EMI, moratorium accrued interest, amortization schedule,
and financial summaries based on scheme details loaded dynamically from schemes.json.
"""

import json
import math
import os
import sys

# Ensure UTF-8 output encoding for currency symbols like ₹ on Windows console
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def format_inr(val):
    """
    Format a numeric value into Indian Rupee currency string (e.g. 100000 -> ₹1,00,000).
    """
    if val is None:
        return "Not specified"
    try:
        val_int = int(round(val))
        s = str(abs(val_int))
        if len(s) <= 3:
            res = s
        else:
            res = s[-3:]
            s = s[:-3]
            while len(s) > 2:
                res = s[-2:] + "," + res
                s = s[:-2]
            if s:
                res = s + "," + res
        prefix = "-" if val_int < 0 else ""
        return f"₹{prefix}{res}"
    except (ValueError, TypeError):
        return f"₹{val}"


def load_schemes(filepath="schemes.json"):
    """
    Load scheme definitions dynamically from schemes.json.
    """
    if not os.path.exists(filepath):
        print(f"ERROR: File '{filepath}' not found in the current directory.")
        return []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            else:
                print(f"ERROR: Expected a JSON array in '{filepath}'.")
                return []
    except json.JSONDecodeError as e:
        print(f"ERROR: Failed to parse '{filepath}': {e}")
        return []
    except Exception as e:
        print(f"ERROR: An error occurred while reading '{filepath}': {e}")
        return []


def get_scheme_details(scheme):
    """
    Extract and structure financial information and limits from a scheme object.
    Handles missing fields gracefully without hardcoding scheme data.
    """
    name = scheme.get("name", "Unknown Scheme")

    # Extract loan information
    loan_info = scheme.get("loan") or {}
    max_amount = loan_info.get("max_amount")
    min_amount = loan_info.get("min_amount")

    # Extract interest information
    interest_info = scheme.get("interest") or {}
    min_rate = interest_info.get("min_rate")
    max_rate = interest_info.get("max_rate")

    interest_rate = None
    interest_rate_str = "Not specified"

    if min_rate is not None and max_rate is not None:
        if min_rate == max_rate:
            interest_rate = float(min_rate)
            interest_rate_str = f"{min_rate}%"
        else:
            interest_rate = float(min_rate)
            interest_rate_str = f"{min_rate}% - {max_rate}%"
    elif min_rate is not None:
        interest_rate = float(min_rate)
        interest_rate_str = f"{min_rate}%"
    elif max_rate is not None:
        interest_rate = float(max_rate)
        interest_rate_str = f"{max_rate}%"

    # Extract tenure information
    tenure_info = scheme.get("tenure") or {}
    max_tenure = tenure_info.get("max_months")
    min_tenure = tenure_info.get("min_months")

    # Extract moratorium information
    moratorium_info = scheme.get("moratorium") or {}
    max_moratorium = moratorium_info.get("max_months")
    min_moratorium = moratorium_info.get("min_months")

    return {
        "scheme_id": scheme.get("scheme_id", ""),
        "name": name,
        "raw_scheme": scheme,
        "max_amount": max_amount,
        "min_amount": min_amount,
        "interest_rate": interest_rate,
        "interest_rate_str": interest_rate_str,
        "min_rate": min_rate,
        "max_rate": max_rate,
        "max_tenure": max_tenure,
        "min_tenure": min_tenure,
        "max_moratorium": max_moratorium,
        "min_moratorium": min_moratorium,
    }


def display_schemes(schemes):
    """
    Display available schemes and prompt the user to select one.
    Supports pagination, keyword searching, and filtering schemes with complete financial data.
    """
    if not schemes:
        print("No schemes available to display.")
        return None

    # Identify schemes with financial information for easy filtering
    schemes_with_rates = []
    for idx, s in enumerate(schemes):
        details = get_scheme_details(s)
        if details["interest_rate"] is not None or details["max_amount"] is not None:
            schemes_with_rates.append((idx, s))

    current_list = schemes
    is_filtered = False
    page_size = 20
    page = 0

    while True:
        total_items = len(current_list)
        total_pages = math.ceil(total_items / page_size) if total_items > 0 else 1

        print("\n" + "=" * 60)
        print("AVAILABLE SCHEMES".center(60))
        print("=" * 60)

        start_idx = page * page_size
        end_idx = min(start_idx + page_size, total_items)

        for i in range(start_idx, end_idx):
            s = current_list[i]
            details = get_scheme_details(s)

            orig_num = schemes.index(s) + 1 if s in schemes else i + 1

            rate_info = f" [Interest: {details['interest_rate_str']}]" if details["interest_rate_str"] != "Not specified" else ""
            loan_info = f" [Max Loan: {format_inr(details['max_amount'])}]" if details["max_amount"] is not None else ""

            print(f"{orig_num:4d}. {details['name']}{rate_info}{loan_info}")

        print("-" * 60)
        print(f"Page {page + 1} of {total_pages} (Showing {start_idx + 1}-{end_idx} of {total_items} schemes)")
        print("[N] Next Page  |  [P] Previous Page  |  [S] Search by Name  |  [F] Toggle Schemes with Financial Data  |  [A] Show All Schemes")
        print("Or enter a Scheme Number to select.")

        user_choice = input("\nSelect scheme (number / command): ").strip()

        if not user_choice:
            continue

        choice_upper = user_choice.upper()

        if choice_upper == "N":
            if page + 1 < total_pages:
                page += 1
            else:
                print("You are on the last page.")
        elif choice_upper == "P":
            if page > 0:
                page -= 1
            else:
                print("You are on the first page.")
        elif choice_upper == "F":
            if not is_filtered:
                current_list = [item[1] for item in schemes_with_rates]
                is_filtered = True
                page = 0
                print(f"Filtered to {len(current_list)} schemes with financial/loan information.")
            else:
                current_list = schemes
                is_filtered = False
                page = 0
                print(f"Showing all {len(current_list)} schemes.")
        elif choice_upper == "A":
            current_list = schemes
            is_filtered = False
            page = 0
        elif choice_upper == "S":
            query = input("Enter search keyword: ").strip().lower()
            if query:
                matched = [s for s in schemes if query in s.get("name", "").lower()]
                if matched:
                    current_list = matched
                    page = 0
                    print(f"Found {len(matched)} matching schemes.")
                else:
                    print(f"No schemes found matching '{query}'.")
        else:
            try:
                num = int(user_choice)
                if 1 <= num <= len(schemes):
                    selected = schemes[num - 1]
                    print(f"\nSelected: {selected.get('name')}")
                    return selected
                elif 1 <= num <= len(current_list):
                    selected = current_list[num - 1]
                    print(f"\nSelected: {selected.get('name')}")
                    return selected
                else:
                    print(f"Invalid scheme number. Please enter a number between 1 and {len(schemes)}.")
            except ValueError:
                print("Invalid input. Please enter a valid scheme number or navigation command.")


def validate_inputs(scheme_details, loan_amount, tenure, moratorium):
    """
    Validate user inputs against scheme limits and requirements.
    Does not silently modify invalid inputs.
    """
    # Interest rate check
    if scheme_details.get("interest_rate") is None:
        return False, "ERROR: The selected scheme does not contain interest rate information required to perform financial calculations."

    # Loan amount validation
    if loan_amount <= 0:
        return False, "ERROR: Loan amount must be greater than 0."

    max_amount = scheme_details.get("max_amount")
    if max_amount is not None and loan_amount > max_amount:
        return False, "ERROR: Requested loan amount exceeds the maximum loan amount allowed by this scheme."

    min_amount = scheme_details.get("min_amount")
    if min_amount is not None and loan_amount < min_amount:
        return False, f"ERROR: Requested loan amount is below the minimum loan amount allowed by this scheme ({format_inr(min_amount)})."

    # Tenure validation
    if tenure <= 0:
        return False, "ERROR: Tenure must be greater than 0 months."

    max_tenure = scheme_details.get("max_tenure")
    if max_tenure is not None and tenure > max_tenure:
        return False, f"ERROR: Tenure exceeds the maximum tenure allowed by this scheme ({max_tenure} months)."

    min_tenure = scheme_details.get("min_tenure")
    if min_tenure is not None and tenure < min_tenure:
        return False, f"ERROR: Tenure is below the minimum tenure required by this scheme ({min_tenure} months)."

    # Moratorium validation
    if moratorium < 0:
        return False, "ERROR: Moratorium cannot be negative."

    max_moratorium = scheme_details.get("max_moratorium")
    if max_moratorium is not None and moratorium > max_moratorium:
        return False, f"ERROR: Moratorium exceeds the maximum moratorium allowed by this scheme ({max_moratorium} months)."

    min_moratorium = scheme_details.get("min_moratorium")
    if min_moratorium is not None and moratorium < min_moratorium:
        return False, f"ERROR: Moratorium is below the minimum moratorium required by this scheme ({min_moratorium} months)."

    return True, ""


def calculate_emi(principal, annual_rate, tenure_months):
    """
    Calculate Monthly EMI using the reducing-balance formula:
    EMI = P * r * (1+r)^n / ((1+r)^n - 1)
    Handles zero interest separately: EMI = P / n
    """
    if tenure_months <= 0:
        return 0.0
    if annual_rate == 0 or annual_rate is None:
        return principal / tenure_months

    r = (annual_rate / 12.0) / 100.0
    n = tenure_months

    emi = principal * r * ((1 + r) ** n) / (((1 + r) ** n) - 1)
    return emi


def calculate_moratorium(principal, annual_rate, moratorium_months):
    """
    Account for moratorium period under the assumption:
    Interest accrues during moratorium and is added to outstanding balance before EMI begins.
    """
    schedule_rows = []
    current_balance = float(principal)
    rate = annual_rate if annual_rate is not None else 0.0
    r = (rate / 12.0) / 100.0 if rate > 0 else 0.0

    for m in range(1, moratorium_months + 1):
        opening = current_balance
        interest = opening * r
        payment = 0.0
        principal_paid = 0.0
        closing = opening + interest
        current_balance = closing

        schedule_rows.append({
            "month": m,
            "phase": "Moratorium",
            "opening": opening,
            "payment": payment,
            "interest": interest,
            "principal": principal_paid,
            "closing": closing
        })

    return schedule_rows, current_balance


def generate_amortization_schedule(loan_amount, annual_rate, tenure_months, moratorium_months):
    """
    Generate month-by-month repayment schedule for moratorium and repayment phases.
    Final payment adjusted for rounding so final closing balance is 0.
    """
    schedule = []

    # Phase 1: Moratorium
    moratorium_rows, balance_after_moratorium = calculate_moratorium(
        loan_amount, annual_rate, moratorium_months
    )
    schedule.extend(moratorium_rows)

    # Phase 2: Repayment
    emi = calculate_emi(balance_after_moratorium, annual_rate, tenure_months)
    rate = annual_rate if annual_rate is not None else 0.0
    r = (rate / 12.0) / 100.0 if rate > 0 else 0.0

    current_balance = balance_after_moratorium

    for m in range(1, tenure_months + 1):
        month_num = moratorium_months + m
        opening = current_balance
        interest = opening * r

        if m == tenure_months:
            # Final month rounding adjustment
            principal_paid = opening
            payment = principal_paid + interest
            closing = 0.0
        else:
            payment = emi
            principal_paid = payment - interest
            if principal_paid >= opening:
                principal_paid = opening
                payment = principal_paid + interest
                closing = 0.0
            else:
                closing = opening - principal_paid

        current_balance = closing
        schedule.append({
            "month": month_num,
            "phase": "Repayment",
            "opening": opening,
            "payment": payment,
            "interest": interest,
            "principal": principal_paid,
            "closing": closing
        })

    return schedule, emi


def calculate_financial_summary(schedule, loan_amount, tenure_months, moratorium_months, emi):
    """
    Calculate financial totals (Total Interest, Total Repayment, Monthly EMI).
    """
    total_interest = sum(row["interest"] for row in schedule)
    total_repayment = sum(row["payment"] for row in schedule)

    return {
        "loan_amount": loan_amount,
        "tenure_months": tenure_months,
        "moratorium_months": moratorium_months,
        "monthly_emi": emi,
        "total_interest": total_interest,
        "total_repayment": total_repayment
    }


def main():
    """
    Main entry point for interactive Financial Calculator.
    """
    print("=" * 60)
    print("FINANCIAL CALCULATOR FOR GOVERNMENT SCHEMES".center(60))
    print("=" * 60)

    # 1. Load schemes dynamically from JSON
    schemes = load_schemes("schemes.json")
    if not schemes:
        print("Failed to load schemes. Exiting calculator.")
        return

    # 2. Select a scheme
    selected_scheme = display_schemes(schemes)
    if not selected_scheme:
        print("No scheme selected. Exiting.")
        return

    # 3. Extract and display scheme details
    details = get_scheme_details(selected_scheme)

    max_tenure_str = f"{details['max_tenure']} months" if details['max_tenure'] is not None else "Not specified"
    max_moratorium_str = f"{details['max_moratorium']} months" if details['max_moratorium'] is not None else "Not specified"

    print("\n" + "=" * 60)
    print(f"Selected Scheme: {details['name']}")
    print("-" * 60)
    print(f"Maximum Loan Amount: {format_inr(details['max_amount'])}")
    print(f"Interest Rate:       {details['interest_rate_str']}")
    print(f"Maximum Tenure:      {max_tenure_str}")
    print(f"Maximum Moratorium:  {max_moratorium_str}")
    print("=" * 60)

    # Check if interest rate is present in scheme data
    if details["interest_rate"] is None:
        print("\nERROR: The selected scheme does not contain interest rate information required to perform financial calculations.")
        print("Financial calculation cannot be performed without an interest rate.")
        return

    # 4. Prompt user for calculation parameters
    print("\nPlease enter calculation parameters:")

    # Prompt Loan Amount
    try:
        loan_amount_input = input("Loan amount: ₹").strip().replace(",", "")
        loan_amount = float(loan_amount_input)
    except ValueError:
        print("ERROR: Invalid input for loan amount. Must be a positive number.")
        return

    # Prompt Tenure
    try:
        tenure_input = input("Tenure (months): ").strip()
        tenure = int(tenure_input)
    except ValueError:
        print("ERROR: Invalid input for tenure. Must be a positive integer.")
        return

    # Prompt Moratorium
    try:
        moratorium_input = input("Moratorium (months): ").strip()
        moratorium = int(moratorium_input)
    except ValueError:
        print("ERROR: Invalid input for moratorium. Must be a non-negative integer.")
        return

    # 5. Validate user inputs against scheme rules
    valid, err_msg = validate_inputs(details, loan_amount, tenure, moratorium)
    if not valid:
        print(f"\n{err_msg}")
        return

    # 6. Display Moratorium assumption if moratorium > 0
    if moratorium > 0:
        print("\n" + "-" * 60)
        print(f"Moratorium: {moratorium} months")
        print("\nAssumption:")
        print("Interest accrues during the moratorium period, no principal is repaid")
        print("during the moratorium, and the accrued interest is added to the")
        print("outstanding balance before regular EMI payments begin.")
        print("-" * 60)

    # 7. Perform calculations and generate amortization schedule
    annual_rate = details["interest_rate"]
    schedule, emi = generate_amortization_schedule(loan_amount, annual_rate, tenure, moratorium)
    summary = calculate_financial_summary(schedule, loan_amount, tenure, moratorium, emi)

    # 8. Display Final Calculation Summary
    print("\n" + "=" * 50)
    print("FINANCIAL CALCULATION".center(50))
    print("=" * 50)
    print(f"\nScheme: {details['name']}\n")
    print(f"Loan Amount:       {format_inr(summary['loan_amount'])}")
    print(f"Interest Rate:     {details['interest_rate_str']}")
    print(f"Tenure:            {summary['tenure_months']} months")
    print(f"Moratorium:        {summary['moratorium_months']} months\n")
    print(f"Monthly EMI:       {format_inr(summary['monthly_emi'])}")
    print(f"Total Interest:    {format_inr(summary['total_interest'])}")
    print(f"Total Repayment:   {format_inr(summary['total_repayment'])}")
    print("=" * 50)

    # 9. Display Amortization Schedule
    print("\nAMORTIZATION SCHEDULE")
    header = f"{'Month':<7} {'Phase':<12} {'Opening':<12} {'Payment':<12} {'Interest':<12} {'Principal':<12} {'Closing':<12}"
    print("-" * len(header))
    print(header)
    print("-" * len(header))

    for row in schedule:
        print(
            f"{row['month']:<7} "
            f"{row['phase']:<12} "
            f"{format_inr(row['opening']):<12} "
            f"{format_inr(row['payment']):<12} "
            f"{format_inr(row['interest']):<12} "
            f"{format_inr(row['principal']):<12} "
            f"{format_inr(row['closing']):<12}"
        )

    print("-" * len(header))


if __name__ == "__main__":
    main()

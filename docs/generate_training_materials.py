"""
Generate MamaPlus mobile training Word guide + PowerPoint presentation.
"""
from pathlib import Path
from datetime import date

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

from pptx import Presentation
from pptx.util import Inches as PInches, Pt as PPt, Emu
from pptx.dml.color import RGBColor as PRGB
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

OUT = Path(r"c:\Users\Stephen Mola\Desktop\projects\uthabiti\mamaplus-mobile\docs")
OUT.mkdir(parents=True, exist_ok=True)

TEAL = RGBColor(0x0D, 0x73, 0x77)
CORAL = RGBColor(0xE5, 0x73, 0x73)
DARK = RGBColor(0x0F, 0x17, 0x2A)
MUTED = RGBColor(0x47, 0x55, 0x69)

P_TEAL = PRGB(0x0D, 0x73, 0x77)
P_CORAL = PRGB(0xE5, 0x73, 0x73)
P_DARK = PRGB(0x0F, 0x17, 0x2A)
P_MUTED = PRGB(0x47, 0x55, 0x69)
P_CREAM = PRGB(0xFF, 0xF8, 0xF5)
P_WHITE = PRGB(0xFF, 0xFF, 0xFF)
P_LIGHT = PRGB(0xF1, 0xF5, 0xF9)


def set_run_font(run, size=11, bold=False, color=DARK, name="Calibri"):
    run.font.name = name
    run._element.rPr.rFonts.set(qn("w:eastAsia"), name)
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color


def add_heading(doc, text, level=1):
    p = doc.add_heading(text, level=level)
    for run in p.runs:
        run.font.color.rgb = TEAL if level == 1 else DARK
    return p


def add_para(doc, text, bold=False, size=11, space_after=8):
    p = doc.add_paragraph()
    run = p.add_run(text)
    set_run_font(run, size=size, bold=bold)
    p.paragraph_format.space_after = Pt(space_after)
    return p


def add_bullets(doc, items):
    for item in items:
        p = doc.add_paragraph(style="List Bullet")
        run = p.add_run(item)
        set_run_font(run, size=11)
        p.paragraph_format.space_after = Pt(4)


def add_numbered(doc, items):
    for item in items:
        p = doc.add_paragraph(style="List Number")
        run = p.add_run(item)
        set_run_font(run, size=11)
        p.paragraph_format.space_after = Pt(4)


def shade_cell(cell, hex_color):
    shading = OxmlElement("w:shd")
    shading.set(qn("w:fill"), hex_color)
    shading.set(qn("w:val"), "clear")
    cell._tePr = cell._tc.get_or_add_tcPr()
    cell._tc.get_or_add_tcPr().append(shading)


def build_word():
    doc = Document()

    # Title
    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = title.add_run("MamaPlus Mobile App")
    set_run_font(r, size=28, bold=True, color=TEAL)

    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = sub.add_run("User Training Guide & How-To Manual")
    set_run_font(r, size=16, bold=True, color=DARK)

    meta = doc.add_paragraph()
    meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = meta.add_run(
        f"For caregivers, agencies, educators & administrators\n"
        f"Version 1.0.1 · {date.today().strftime('%B %Y')} · mamaplus.co.ke"
    )
    set_run_font(r, size=11, color=MUTED)

    doc.add_paragraph()

    # Suggested training schedule
    add_heading(doc, "1. Suggested Training Schedule", 1)
    add_para(
        doc,
        "Use this schedule for onboarding workshops, agency briefings, or caregiver orientation sessions.",
    )

    table = doc.add_table(rows=6, cols=3)
    table.style = "Table Grid"
    headers = ["Session", "Duration", "Focus"]
    rows = [
        ("Session 1 — Getting Started", "20–25 min", "Install, register, login, onboarding"),
        ("Session 2 — Caregiver Daily Use", "30–40 min", "Home, courses, progress, blog, profile"),
        ("Session 3 — Membership & Network", "15–20 min", "Join Network, CareProtect, SACCO"),
        ("Session 4 — Agency / Educator (optional)", "20–25 min", "Role-specific dashboards"),
        ("Session 5 — Admin Overview (optional)", "20–25 min", "Manage users, enrollments, payments"),
    ]
    for i, h in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.text = h
        for p in cell.paragraphs:
            for run in p.runs:
                set_run_font(run, bold=True, color=RGBColor(0xFF, 0xFF, 0xFF), size=11)
        shade_cell(cell, "0D7377")
    for r_i, row in enumerate(rows, start=1):
        for c_i, val in enumerate(row):
            cell = table.rows[r_i].cells[c_i]
            cell.text = val
            for p in cell.paragraphs:
                for run in p.runs:
                    set_run_font(run, size=10)

    doc.add_paragraph()

    add_heading(doc, "2. Introduction — What Is MamaPlus?", 1)
    add_para(
        doc,
        "MamaPlus is a caregiving training and professional network platform focused on Kenya and East Africa. "
        "The mobile app is the companion to the web portal at mamaplus.co.ke. Users can register, complete onboarding, "
        "browse and enroll in courses, track learning progress, read the blog, manage their profile, and (with membership) "
        "access Network, CareProtect, and SACCO services.",
    )
    add_bullets(
        doc,
        [
            "Primary audience: Caregivers seeking professional training and career growth",
            "Also supports: Agencies, Educators, Admin Assistants, and Administrators",
            "Requires internet connection; production app connects to https://mamaplus.co.ke",
        ],
    )

    add_heading(doc, "3. Installing the App (Android APK)", 1)
    add_numbered(
        doc,
        [
            "Receive the MamaPlus APK file (or open the Expo install link on your Android phone).",
            "If prompted, allow installation from unknown sources / the browser used to download.",
            "Open the installer and tap Install.",
            "When finished, open MamaPlus. You should see the MamaPlus logo (coral parent + teal child mark).",
            "Choose Sign In (existing account) or Create an account (new user).",
        ],
    )

    add_heading(doc, "4. Getting Started — Registration", 1)
    add_para(doc, "From the Sign In screen, tap Create an account / Create Account.", bold=False)
    add_para(doc, "Required fields:", bold=True)
    add_bullets(
        doc,
        [
            "Full Name (at least 2 characters)",
            "Email Address (valid email format)",
            "Phone Number — select country (default Kenya +254), then enter the national number",
            "Password (at least 8 characters)",
            "Confirm Password (must match)",
            "Agree to Terms of Service and Privacy Policy (checkbox)",
        ],
    )
    add_para(
        doc,
        "Tip: Kenyan numbers like 0712 345 678 are accepted and stored in international format (254…). "
        "Other supported countries include Uganda, Tanzania, Rwanda, and more.",
    )
    add_para(doc, "Tap Create Account. On success you are signed in automatically and sent to onboarding.")

    add_heading(doc, "5. Getting Started — Login", 1)
    add_numbered(
        doc,
        [
            "Open MamaPlus.",
            "Enter Email and Password.",
            "Tap Sign In.",
            "Your session is saved on the device for next launches.",
        ],
    )

    add_heading(doc, "6. Onboarding — Choose Your Role", 1)
    add_para(
        doc,
        "New accounts start as Pending until onboarding is completed. This is required once after registration.",
    )
    add_numbered(
        doc,
        [
            "Select your role: Caregiver, Agency, or Educator.",
            "If you selected Caregiver, continue and choose Male or Female.",
            "Tap Continue / Go to My Dashboard.",
            "The app opens the dashboard for your role.",
        ],
    )
    add_para(
        doc,
        "Important for training: Most learners should choose Caregiver. Agency and Educator are for organisations and trainers.",
    )

    add_heading(doc, "7. Understanding Roles", 1)
    role_table = doc.add_table(rows=6, cols=2)
    role_table.style = "Table Grid"
    role_data = [
        ("Role", "What you can do in the mobile app"),
        ("Caregiver", "Home tiles, enroll & learn courses, blog, edit profile, track progress"),
        ("Agency", "View stats, search/recruit caregivers, sponsor courses, rate caregivers"),
        ("Educator", "View course dashboards and browse published courses (no enrollment)"),
        ("Admin Assistant", "Home, Blog, and Profile (blog-focused, matching web)"),
        ("Administrator", "Overview stats, Courses, Manage (users, enrollments, payments, etc.)"),
    ]
    for r_i, (a, b) in enumerate(role_data):
        role_table.rows[r_i].cells[0].text = a
        role_table.rows[r_i].cells[1].text = b
        for c_i, cell in enumerate(role_table.rows[r_i].cells):
            for p in cell.paragraphs:
                for run in p.runs:
                    set_run_font(run, size=10, bold=(r_i == 0))
                    if r_i == 0:
                        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        if r_i == 0:
            shade_cell(role_table.rows[r_i].cells[0], "0D7377")
            shade_cell(role_table.rows[r_i].cells[1], "0D7377")

    doc.add_paragraph()

    add_heading(doc, "8. Caregiver Home Screen", 1)
    add_bullets(
        doc,
        [
            "Welcome message with your name and Caregiver role badge",
            "Service Access Point tiles: Network, CareProtect, SACCO, Courses",
            "Courses is always available; Network / CareProtect / SACCO unlock with membership",
            "Non-members see Join Network — KES 3,600/yr (opens the website join page)",
            "Quick actions: Browse Courses, Read Blog, My Profile",
            "Stats: Enrolled courses, Payments, Reviews",
            "In Progress: courses you started with completion percentage",
        ],
    )

    add_heading(doc, "9. How to Use Courses (Caregiver How-To)", 1)
    add_para(doc, "Browse and enroll", bold=True)
    add_numbered(
        doc,
        [
            "Tap the Courses tab.",
            "Use search to find a course by title or description.",
            "Review duration, schedule, location/category, and price.",
            "For free courses, tap Enroll.",
            "For paid courses, complete payment on the web portal (mamaplus.co.ke), then return to the app.",
        ],
    )
    add_para(doc, "Learn and track progress", bold=True)
    add_numbered(
        doc,
        [
            "Open a course from Courses or from Home → In Progress.",
            "Read the overview, objectives, and modules/lessons.",
            "Mark lessons complete as you finish them.",
            "Watch your progress percentage update on Home and Courses.",
        ],
    )

    add_heading(doc, "10. Reading the Blog", 1)
    add_numbered(
        doc,
        [
            "Tap the Blog tab.",
            "Filter by category (or view All Posts).",
            "Tap an article to read the full content, tags, and related posts.",
        ],
    )
    add_para(
        doc,
        "Blog topics typically include childcare tips, parenting advice, and caregiver career guidance.",
    )

    add_heading(doc, "11. Managing Your Profile", 1)
    add_bullets(
        doc,
        [
            "Open Profile to see name, email, phone, role, and verification status.",
            "Edit Profile: update full name, email, and phone (with country + dial code).",
            "Change Password: enter current password and a new password (min 8 characters).",
            "Help & Support: contact / support screen.",
            "Sign Out: clears your session on the device.",
        ],
    )

    add_heading(doc, "12. Joining the MamaPlus Network", 1)
    add_para(
        doc,
        "Membership unlocks Network, CareProtect, and SACCO tiles on Home. Annual membership is KES 3,600.",
    )
    add_numbered(
        doc,
        [
            "On Home, if tiles show Locked, tap Join Network — KES 3,600/yr.",
            "Complete registration/payment on the website (join-network page).",
            "Return to the app and refresh Home to see unlocked status.",
        ],
    )
    add_para(
        doc,
        "Note: You can still browse and take free courses without membership.",
    )

    add_heading(doc, "13. Agency Features (Overview)", 1)
    add_bullets(
        doc,
        [
            "Home: agency stats and recruiting from available caregivers.",
            "Search: find caregivers, recruit, or sponsor courses.",
            "Profile → My Caregivers: roster and ratings.",
        ],
    )

    add_heading(doc, "14. Educator Features (Overview)", 1)
    add_bullets(
        doc,
        [
            "Home dashboard with course-related KPIs.",
            "Browse published courses (enrollment is for caregivers).",
            "Profile management same as other roles.",
        ],
    )

    add_heading(doc, "15. Admin & Admin Assistant (Overview)", 1)
    add_para(doc, "Admin Assistant", bold=True)
    add_bullets(doc, ["Home, Blog, and Profile — aligned with the web assistant role."])
    add_para(doc, "Administrator", bold=True)
    add_bullets(
        doc,
        [
            "Home: live platform overview (users, enrollments, courses, revenue, schools, activity).",
            "Courses: create/edit/publish courses.",
            "Manage hub: Users, Enrollments, Payments, Agencies, Reviews, Certificates, Schools, Blog.",
            "Profile: account settings.",
        ],
    )

    add_heading(doc, "16. Troubleshooting & Support", 1)
    add_bullets(
        doc,
        [
            "Cannot register: check email format, password length (8+), matching passwords, valid phone, and terms checkbox.",
            "Email already exists: sign in instead, or use a different email.",
            "Not authenticated during onboarding: ensure you have internet and the latest app build pointing to mamaplus.co.ke.",
            "Paid course enrollment: complete payment on the website, then reopen Courses in the app.",
            "Locked Network/CareProtect/SACCO: join membership on the web, then refresh Home.",
            "Support: Profile → Help & Support, or visit mamaplus.co.ke.",
        ],
    )

    add_heading(doc, "17. Appendix — Caregiver Quick Checklist", 1)
    add_numbered(
        doc,
        [
            "Install MamaPlus APK and open the app.",
            "Create account with name, email, phone, password, and terms.",
            "Onboard as Caregiver and select gender.",
            "Explore Home tiles and Quick Actions.",
            "Browse Courses → enroll in a free course.",
            "Open the course and mark lessons complete.",
            "Read a Blog article.",
            "Update Profile if needed.",
            "Optional: Join Network on the web for membership benefits.",
        ],
    )

    add_heading(doc, "18. Facilitator Notes (Training Delivery)", 1)
    add_bullets(
        doc,
        [
            "Demo on a real Android phone with the latest APK installed.",
            "Prepare one demo caregiver account and one free course for live enrollment.",
            "Have learners use their own emails/phones; avoid sharing passwords.",
            "For paid features, show the web portal on a projector rather than collecting payments in the workshop.",
            "Leave 5–10 minutes for Q&A and Help & Support walkthrough.",
        ],
    )

    footer = doc.add_paragraph()
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = footer.add_run("\n© MamaPlus · Training materials for internal and partner use · mamaplus.co.ke")
    set_run_font(r, size=9, color=MUTED)

    path = OUT / "MamaPlus_Mobile_User_Training_Guide.docx"
    doc.save(path)
    return path


def add_title_shape(slide, text, left, top, width, height, size=32, bold=True, color=P_DARK, align=PP_ALIGN.LEFT):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = PPt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = "Calibri"
    return box


def add_body(slide, lines, left, top, width, height, size=16, color=P_MUTED):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.level = 0
        p.space_after = PPt(6)
        run = p.add_run()
        run.text = line
        run.font.size = PPt(size)
        run.font.color.rgb = color
        run.font.name = "Calibri"
    return box


def style_slide_bg(slide, rgb=P_CREAM):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = rgb


def accent_bar(slide):
    shape = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, PInches(0), PInches(0), PInches(0.18), PInches(5.625)
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = P_TEAL
    shape.line.fill.background()


def build_pptx():
    prs = Presentation()
    prs.slide_width = PInches(10)
    prs.slide_height = PInches(5.625)

    # 1 Title
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s, P_TEAL)
    add_title_shape(s, "MamaPlus Mobile", PInches(0.7), PInches(1.5), PInches(8.5), PInches(1), 40, True, P_WHITE)
    add_title_shape(
        s,
        "How the App Works — User Training Presentation",
        PInches(0.7),
        PInches(2.4),
        PInches(8.5),
        PInches(0.6),
        20,
        False,
        P_WHITE,
    )
    add_title_shape(
        s,
        f"Caregiver-first · Agencies · Educators · Admins\n{date.today().strftime('%B %Y')} · mamaplus.co.ke",
        PInches(0.7),
        PInches(3.4),
        PInches(8.5),
        PInches(1),
        14,
        False,
        P_WHITE,
    )

    # 2 Agenda / schedule
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s)
    accent_bar(s)
    add_title_shape(s, "Training Schedule", PInches(0.5), PInches(0.3), PInches(9), PInches(0.6), 28, True, P_TEAL)
    add_body(
        s,
        [
            "1. Getting Started (20–25 min) — Install, register, login, onboarding",
            "2. Caregiver Daily Use (30–40 min) — Home, courses, progress, blog, profile",
            "3. Membership & Network (15–20 min) — Join Network, CareProtect, SACCO",
            "4. Agency / Educator overview (optional, 20–25 min)",
            "5. Admin overview (optional, 20–25 min)",
            "Leave time for practice + Q&A at the end of each session.",
        ],
        PInches(0.5),
        PInches(1.1),
        PInches(8.8),
        PInches(4),
        16,
        P_DARK,
    )

    # 3 What is MamaPlus
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s)
    accent_bar(s)
    add_title_shape(s, "What Is MamaPlus?", PInches(0.5), PInches(0.3), PInches(9), PInches(0.6), 28, True, P_TEAL)
    add_body(
        s,
        [
            "• Caregiving training & professional network platform for Kenya / East Africa",
            "• Mobile companion to the web portal: mamaplus.co.ke",
            "• Learn courses, track progress, read expert blog content",
            "• Membership unlocks Network, CareProtect, and SACCO services",
            "• Role-based dashboards for Caregivers, Agencies, Educators, and Admins",
        ],
        PInches(0.5),
        PInches(1.2),
        PInches(8.8),
        PInches(3.5),
        18,
        P_DARK,
    )

    # 4 Install
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s)
    accent_bar(s)
    add_title_shape(s, "Install the App (Android)", PInches(0.5), PInches(0.3), PInches(9), PInches(0.6), 28, True, P_TEAL)
    add_body(
        s,
        [
            "1. Download / open the MamaPlus APK install link on your phone",
            "2. Allow install from unknown sources if prompted",
            "3. Tap Install, then Open MamaPlus",
            "4. Confirm the MamaPlus logo appears on your home screen",
            "5. Choose Sign In or Create an account",
            "Internet required — the app connects to mamaplus.co.ke",
        ],
        PInches(0.5),
        PInches(1.2),
        PInches(8.8),
        PInches(3.5),
        18,
        P_DARK,
    )

    # 5 Register
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s)
    accent_bar(s)
    add_title_shape(s, "Create an Account", PInches(0.5), PInches(0.3), PInches(9), PInches(0.6), 28, True, P_TEAL)
    add_body(
        s,
        [
            "• Full Name · Email · Phone (country + dial code, Kenya default)",
            "• Password (8+ characters) · Confirm Password",
            "• Agree to Terms of Service & Privacy Policy",
            "• Tap Create Account → you are signed in automatically",
            "Next step: Onboarding (choose role)",
        ],
        PInches(0.5),
        PInches(1.2),
        PInches(8.8),
        PInches(3.5),
        18,
        P_DARK,
    )

    # 6 Onboarding
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s)
    accent_bar(s)
    add_title_shape(s, "Onboarding — Choose Your Role", PInches(0.5), PInches(0.3), PInches(9), PInches(0.6), 28, True, P_TEAL)
    add_body(
        s,
        [
            "1. Select Caregiver, Agency, or Educator",
            "2. Caregivers also select Male or Female",
            "3. Tap Go to My Dashboard",
            "Training tip: Most workshop participants should choose Caregiver",
            "You only complete onboarding once per new account",
        ],
        PInches(0.5),
        PInches(1.2),
        PInches(8.8),
        PInches(3.5),
        18,
        P_DARK,
    )

    # 7 Roles
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s)
    accent_bar(s)
    add_title_shape(s, "Roles at a Glance", PInches(0.5), PInches(0.3), PInches(9), PInches(0.6), 28, True, P_TEAL)
    add_body(
        s,
        [
            "Caregiver — Courses, progress, blog, profile, membership tiles",
            "Agency — Recruit / search caregivers, sponsor, rate roster",
            "Educator — View courses & learner insights (browse only)",
            "Admin Assistant — Blog + profile focused workspace",
            "Administrator — Stats, course tools, Manage hub (users, payments…)",
        ],
        PInches(0.5),
        PInches(1.2),
        PInches(8.8),
        PInches(3.5),
        17,
        P_DARK,
    )

    # 8 Caregiver home
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s)
    accent_bar(s)
    add_title_shape(s, "Caregiver Home", PInches(0.5), PInches(0.3), PInches(9), PInches(0.6), 28, True, P_TEAL)
    add_body(
        s,
        [
            "• Service tiles: Network · CareProtect · SACCO · Courses",
            "• Courses always Open; others unlock with membership",
            "• Join Network — KES 3,600/yr opens the web join page",
            "• Quick actions: Courses, Blog, Profile",
            "• Stats + In Progress list with % complete",
        ],
        PInches(0.5),
        PInches(1.2),
        PInches(8.8),
        PInches(3.5),
        18,
        P_DARK,
    )

    # 9 Courses
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s)
    accent_bar(s)
    add_title_shape(s, "Courses — Browse, Enroll, Learn", PInches(0.5), PInches(0.3), PInches(9), PInches(0.6), 28, True, P_TEAL)
    add_body(
        s,
        [
            "1. Open Courses tab and search for a topic",
            "2. Free courses → Enroll in-app",
            "3. Paid courses → pay on the web portal, then return",
            "4. Open course → work through modules/lessons",
            "5. Mark lessons complete → progress % updates on Home",
        ],
        PInches(0.5),
        PInches(1.2),
        PInches(8.8),
        PInches(3.5),
        18,
        P_DARK,
    )

    # 10 Blog + Profile
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s)
    accent_bar(s)
    add_title_shape(s, "Blog & Profile", PInches(0.5), PInches(0.3), PInches(9), PInches(0.6), 28, True, P_TEAL)
    add_body(
        s,
        [
            "Blog: filter by category → open articles on childcare & careers",
            "Profile: view role, verification, course stats",
            "Edit Profile: name, email, phone (country picker)",
            "Change Password · Help & Support · Sign Out",
        ],
        PInches(0.5),
        PInches(1.2),
        PInches(8.8),
        PInches(3.5),
        18,
        P_DARK,
    )

    # 11 Membership
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s)
    accent_bar(s)
    add_title_shape(s, "Membership — Network Benefits", PInches(0.5), PInches(0.3), PInches(9), PInches(0.6), 28, True, P_TEAL)
    add_body(
        s,
        [
            "• Annual membership: KES 3,600",
            "• Unlocks Network, CareProtect, and SACCO tiles",
            "• Join from Home → website join-network page",
            "• Free courses remain available without membership",
            "• After joining, reopen Home to refresh status",
        ],
        PInches(0.5),
        PInches(1.2),
        PInches(8.8),
        PInches(3.5),
        18,
        P_DARK,
    )

    # 12 Agency / Educator / Admin brief
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s)
    accent_bar(s)
    add_title_shape(s, "Other Roles (Brief)", PInches(0.5), PInches(0.3), PInches(9), PInches(0.6), 28, True, P_TEAL)
    add_body(
        s,
        [
            "Agency: search & recruit caregivers, sponsor courses, rate roster",
            "Educator: monitor courses / learners; browse without enrolling",
            "Admin Assistant: Blog + Profile workspace",
            "Admin: overview KPIs + Manage (Users, Enrollments, Payments,",
            "        Agencies, Reviews, Certificates, Schools, Blog)",
        ],
        PInches(0.5),
        PInches(1.2),
        PInches(8.8),
        PInches(3.5),
        17,
        P_DARK,
    )

    # 13 Caregiver checklist
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s)
    accent_bar(s)
    add_title_shape(s, "Caregiver Practice Checklist", PInches(0.5), PInches(0.3), PInches(9), PInches(0.6), 28, True, P_TEAL)
    add_body(
        s,
        [
            "☐ Install app  ☐ Create account  ☐ Onboard as Caregiver",
            "☐ Explore Home tiles  ☐ Enroll in a free course",
            "☐ Mark a lesson complete  ☐ Read a blog post",
            "☐ Edit profile details  ☐ Optional: Join Network on web",
        ],
        PInches(0.5),
        PInches(1.3),
        PInches(8.8),
        PInches(3.5),
        18,
        P_DARK,
    )

    # 14 Support / close
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s, P_TEAL)
    add_title_shape(s, "Support & Next Steps", PInches(0.7), PInches(1.4), PInches(8.5), PInches(0.7), 32, True, P_WHITE)
    add_title_shape(
        s,
        "In-app: Profile → Help & Support\nWeb: https://mamaplus.co.ke\nThank you — let’s practice on your phones!",
        PInches(0.7),
        PInches(2.4),
        PInches(8.5),
        PInches(2),
        18,
        False,
        P_WHITE,
    )

    path = OUT / "MamaPlus_Mobile_Training_Presentation.pptx"
    prs.save(path)
    return path


if __name__ == "__main__":
    word = build_word()
    ppt = build_pptx()
    print("WORD:", word)
    print("PPTX:", ppt)

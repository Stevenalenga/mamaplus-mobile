"""
Rebuild MamaPlus training PowerPoint with brand images + slide transitions.
"""
from pathlib import Path
from datetime import date
from copy import deepcopy

from pptx import Presentation
from pptx.util import Inches as PInches, Pt as PPt, Emu
from pptx.dml.color import RGBColor as PRGB
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn
from lxml import etree

OUT = Path(r"c:\Users\Stephen Mola\Desktop\projects\uthabiti\mamaplus-mobile\docs")
ASSETS = Path(r"c:\Users\Stephen Mola\Desktop\projects\uthabiti\mamaplus-mobile\assets")
GEN = Path(
    r"C:\Users\Stephen Mola\.cursor\projects\c-Users-Stephen-Mola-Desktop-projects-uthabiti-mamaplus-mobile\assets"
)
IMG = OUT / "images"
IMG.mkdir(parents=True, exist_ok=True)

P_TEAL = PRGB(0x0D, 0x73, 0x77)
P_CORAL = PRGB(0xE5, 0x73, 0x73)
P_DARK = PRGB(0x0F, 0x17, 0x2A)
P_MUTED = PRGB(0x47, 0x55, 0x69)
P_CREAM = PRGB(0xFF, 0xF8, 0xF5)
P_WHITE = PRGB(0xFF, 0xFF, 0xFF)
P_LIGHT = PRGB(0xEC, 0xF4, 0xF4)

NS_P = "http://schemas.openxmlformats.org/presentationml/2006/main"


def copy_images():
    mapping = {
        "icon.png": ASSETS / "icon.png",
        "logo.png": ASSETS / "logo.png",
        "ppt-install.png": GEN / "ppt-install.png",
        "ppt-courses.png": GEN / "ppt-courses.png",
        "ppt-network.png": GEN / "ppt-network.png",
    }
    for name, src in mapping.items():
        dest = IMG / name
        if src.exists():
            dest.write_bytes(src.read_bytes())
        elif (ASSETS / name).exists():
            dest.write_bytes((ASSETS / name).read_bytes())
    return {
        "icon": IMG / "icon.png",
        "logo": IMG / "logo.png",
        "install": IMG / "ppt-install.png",
        "courses": IMG / "ppt-courses.png",
        "network": IMG / "ppt-network.png",
    }


def set_transition(slide, effect="fade", speed="med", advance_on_click=True):
    """Attach a PowerPoint slide transition via OOXML."""
    sld = slide._element
    # Remove existing transition nodes
    for node in list(sld):
        if node.tag == qn("p:transition"):
            sld.remove(node)

    transition = etree.Element(qn("p:transition"))
    transition.set("spd", speed)
    transition.set("advClick", "1" if advance_on_click else "0")

    effects = {
        "fade": ("p:fade", {}),
        "push": ("p:push", {"dir": "l"}),
        "wipe": ("p:wipe", {"dir": "l"}),
        "cover": ("p:cover", {"dir": "r"}),
        "split": ("p:split", {"orient": "horz", "dir": "out"}),
        "cut": ("p:cut", {}),
        "dissolve": ("p:dissolve", {}),
        "wheel": ("p:wheel", {"spokes": "4"}),
    }
    tag, attrs = effects.get(effect, effects["fade"])
    child = etree.SubElement(transition, qn(tag))
    for k, v in attrs.items():
        child.set(k, v)

    # Insert after cSld / clrMapOvr
    insert_at = 1
    for i, node in enumerate(list(sld)):
        if node.tag in (qn("p:cSld"), qn("p:clrMapOvr")):
            insert_at = i + 1
    sld.insert(insert_at, transition)


def style_slide_bg(slide, rgb=P_CREAM):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = rgb


def accent_bar(slide):
    shape = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, PInches(0), PInches(0), PInches(0.16), PInches(5.625)
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = P_TEAL
    shape.line.fill.background()


def footer(slide, page, total):
    box = slide.shapes.add_textbox(PInches(0.5), PInches(5.25), PInches(8.5), PInches(0.3))
    tf = box.text_frame
    p = tf.paragraphs[0]
    run = p.add_run()
    run.text = f"MamaPlus Mobile Training  ·  mamaplus.co.ke  ·  {page}/{total}"
    run.font.size = PPt(10)
    run.font.color.rgb = P_MUTED
    run.font.name = "Calibri"


def add_title(slide, text, left, top, width, height, size=28, bold=True, color=P_TEAL, align=PP_ALIGN.LEFT):
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


def add_body(slide, lines, left, top, width, height, size=16, color=P_DARK):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.space_after = PPt(8)
        run = p.add_run()
        run.text = line
        run.font.size = PPt(size)
        run.font.color.rgb = color
        run.font.name = "Calibri"
    return box


def add_card(slide, left, top, width, height):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = P_WHITE
    shape.line.color.rgb = PRGB(0xE2, 0xE8, 0xF0)
    shape.line.width = Emu(12700)
    try:
        shape.adjustments[0] = 0.1
    except Exception:
        pass
    return shape


def add_picture_safe(slide, path, left, top, width=None, height=None):
    if not path or not Path(path).exists():
        return None
    kwargs = {}
    if width is not None:
        kwargs["width"] = width
    if height is not None:
        kwargs["height"] = height
    return slide.shapes.add_picture(str(path), left, top, **kwargs)


def build():
    images = copy_images()
    prs = Presentation()
    prs.slide_width = PInches(10)
    prs.slide_height = PInches(5.625)

    slides_meta = []  # (slide, transition)

    # 1 Title
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s, P_TEAL)
    # Decorative coral bar
    bar = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, PInches(0), PInches(5.2), PInches(10), PInches(0.425))
    bar.fill.solid()
    bar.fill.fore_color.rgb = P_CORAL
    bar.line.fill.background()
    add_picture_safe(s, images["icon"], PInches(0.7), PInches(1.2), width=PInches(1.5))
    add_title(s, "MamaPlus Mobile", PInches(2.5), PInches(1.4), PInches(6.8), PInches(0.8), 40, True, P_WHITE)
    add_title(
        s,
        "How the App Works — User Training Presentation",
        PInches(2.5),
        PInches(2.3),
        PInches(6.8),
        PInches(0.5),
        18,
        False,
        P_WHITE,
    )
    add_title(
        s,
        f"Caregiver-first · Agencies · Educators · Admins\n{date.today().strftime('%B %Y')} · mamaplus.co.ke",
        PInches(2.5),
        PInches(3.2),
        PInches(6.8),
        PInches(1),
        14,
        False,
        P_WHITE,
    )
    slides_meta.append((s, "fade"))

    # 2 Schedule
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s)
    accent_bar(s)
    add_title(s, "Training Schedule", PInches(0.5), PInches(0.25), PInches(9), PInches(0.55), 28, True, P_TEAL)
    add_picture_safe(s, images["icon"], PInches(8.7), PInches(0.2), width=PInches(0.9))
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
        PInches(3.8),
        16,
        P_DARK,
    )
    slides_meta.append((s, "push"))

    # 3 What is MamaPlus
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s)
    accent_bar(s)
    add_title(s, "What Is MamaPlus?", PInches(0.5), PInches(0.25), PInches(5.5), PInches(0.55), 28, True, P_TEAL)
    add_body(
        s,
        [
            "• Caregiving training & network for Kenya / East Africa",
            "• Mobile companion to mamaplus.co.ke",
            "• Courses, progress tracking, and expert blog",
            "• Membership unlocks Network, CareProtect, SACCO",
            "• Role-based dashboards for every user type",
        ],
        PInches(0.5),
        PInches(1.1),
        PInches(5.2),
        PInches(3.6),
        16,
        P_DARK,
    )
    add_card(s, PInches(6.0), PInches(0.9), PInches(3.5), PInches(3.8))
    add_picture_safe(s, images["icon"], PInches(6.55), PInches(1.5), width=PInches(2.4))
    add_title(s, "Brand mark", PInches(6.0), PInches(4.2), PInches(3.5), PInches(0.4), 12, False, P_MUTED, PP_ALIGN.CENTER)
    slides_meta.append((s, "wipe"))

    # 4 Install
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s)
    accent_bar(s)
    add_title(s, "Install the App (Android)", PInches(0.5), PInches(0.25), PInches(5.2), PInches(0.55), 26, True, P_TEAL)
    add_body(
        s,
        [
            "1. Open the MamaPlus APK install link",
            "2. Allow install from unknown sources",
            "3. Tap Install, then Open MamaPlus",
            "4. Confirm the MamaPlus logo on home screen",
            "5. Choose Sign In or Create an account",
            "Internet required — connects to mamaplus.co.ke",
        ],
        PInches(0.5),
        PInches(1.0),
        PInches(5.0),
        PInches(3.8),
        15,
        P_DARK,
    )
    if images["install"].exists():
        add_picture_safe(s, images["install"], PInches(5.5), PInches(0.85), width=PInches(4.2))
    slides_meta.append((s, "cover"))

    # 5 Register
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s)
    accent_bar(s)
    add_title(s, "Create an Account", PInches(0.5), PInches(0.25), PInches(9), PInches(0.55), 28, True, P_TEAL)
    add_picture_safe(s, images["icon"], PInches(8.7), PInches(0.2), width=PInches(0.9))
    # Three feature cards
    cards = [
        (0.5, "Details", "Full name, email, and phone with country dial code (Kenya +254 default)"),
        (3.5, "Security", "Password 8+ characters, confirm match, agree to Terms & Privacy"),
        (6.5, "Next", "Tap Create Account — you are signed in and sent to onboarding"),
    ]
    for left, title, body in cards:
        add_card(s, PInches(left), PInches(1.2), PInches(2.8), PInches(3.2))
        add_title(s, title, PInches(left + 0.2), PInches(1.45), PInches(2.4), PInches(0.5), 18, True, P_TEAL)
        add_body(s, [body], PInches(left + 0.2), PInches(2.1), PInches(2.4), PInches(2.0), 13, P_MUTED)
    slides_meta.append((s, "fade"))

    # 6 Onboarding
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s)
    accent_bar(s)
    add_title(s, "Onboarding — Choose Your Role", PInches(0.5), PInches(0.25), PInches(9), PInches(0.55), 26, True, P_TEAL)
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
        PInches(1.1),
        PInches(8.8),
        PInches(3.5),
        17,
        P_DARK,
    )
    slides_meta.append((s, "push"))

    # 7 Roles
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s)
    accent_bar(s)
    add_title(s, "Roles at a Glance", PInches(0.5), PInches(0.25), PInches(9), PInches(0.55), 28, True, P_TEAL)
    roles = [
        ("Caregiver", "Courses, progress, blog, profile, membership"),
        ("Agency", "Recruit / search caregivers, sponsor, rate"),
        ("Educator", "View courses & learners (browse only)"),
        ("Admin Assistant", "Blog + profile focused workspace"),
        ("Administrator", "Stats + Manage hub (users, payments…)"),
    ]
    y = 1.0
    for title, desc in roles:
        add_card(s, PInches(0.5), PInches(y), PInches(8.8), PInches(0.7))
        add_title(s, title, PInches(0.7), PInches(y + 0.08), PInches(2.5), PInches(0.5), 14, True, P_TEAL)
        add_title(s, desc, PInches(3.3), PInches(y + 0.12), PInches(5.7), PInches(0.45), 13, False, P_DARK)
        y += 0.78
    slides_meta.append((s, "wipe"))

    # 8 Caregiver home
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s)
    accent_bar(s)
    add_title(s, "Caregiver Home", PInches(0.5), PInches(0.25), PInches(5.2), PInches(0.55), 28, True, P_TEAL)
    add_body(
        s,
        [
            "• Tiles: Network · CareProtect · SACCO · Courses",
            "• Courses always Open; others need membership",
            "• Join Network — KES 3,600/yr (opens website)",
            "• Quick actions: Courses, Blog, Profile",
            "• Stats + In Progress with % complete",
        ],
        PInches(0.5),
        PInches(1.0),
        PInches(5.0),
        PInches(3.6),
        15,
        P_DARK,
    )
    if images["install"].exists():
        add_picture_safe(s, images["install"], PInches(5.5), PInches(0.85), width=PInches(4.2))
    slides_meta.append((s, "cover"))

    # 9 Courses
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s)
    accent_bar(s)
    add_title(s, "Courses — Browse, Enroll, Learn", PInches(0.5), PInches(0.25), PInches(5.2), PInches(0.55), 24, True, P_TEAL)
    add_body(
        s,
        [
            "1. Open Courses and search a topic",
            "2. Free courses → Enroll in-app",
            "3. Paid courses → pay on the web portal",
            "4. Work through modules / lessons",
            "5. Mark complete → progress updates",
        ],
        PInches(0.5),
        PInches(1.0),
        PInches(5.0),
        PInches(3.6),
        15,
        P_DARK,
    )
    if images["courses"].exists():
        add_picture_safe(s, images["courses"], PInches(5.5), PInches(0.85), width=PInches(4.2))
    slides_meta.append((s, "push"))

    # 10 Blog + Profile
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s)
    accent_bar(s)
    add_title(s, "Blog & Profile", PInches(0.5), PInches(0.25), PInches(9), PInches(0.55), 28, True, P_TEAL)
    add_card(s, PInches(0.5), PInches(1.1), PInches(4.3), PInches(3.4))
    add_title(s, "📰  Blog", PInches(0.8), PInches(1.35), PInches(3.8), PInches(0.5), 20, True, P_TEAL)
    add_body(
        s,
        [
            "Filter by category",
            "Open articles on childcare",
            "and caregiver careers",
            "Read related posts",
        ],
        PInches(0.8),
        PInches(2.1),
        PInches(3.7),
        PInches(2.0),
        14,
        P_MUTED,
    )
    add_card(s, PInches(5.2), PInches(1.1), PInches(4.3), PInches(3.4))
    add_title(s, "👤  Profile", PInches(5.5), PInches(1.35), PInches(3.8), PInches(0.5), 20, True, P_TEAL)
    add_body(
        s,
        [
            "Edit name, email, phone",
            "Country + dial code picker",
            "Change password",
            "Help & Support · Sign Out",
        ],
        PInches(5.5),
        PInches(2.1),
        PInches(3.7),
        PInches(2.0),
        14,
        P_MUTED,
    )
    slides_meta.append((s, "fade"))

    # 11 Membership
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s)
    accent_bar(s)
    add_title(s, "Membership — Network Benefits", PInches(0.5), PInches(0.25), PInches(5.2), PInches(0.55), 24, True, P_TEAL)
    add_body(
        s,
        [
            "• Annual membership: KES 3,600",
            "• Unlocks Network, CareProtect, SACCO",
            "• Join from Home → website join page",
            "• Free courses work without membership",
            "• Reopen Home after joining to refresh",
        ],
        PInches(0.5),
        PInches(1.0),
        PInches(5.0),
        PInches(3.6),
        15,
        P_DARK,
    )
    if images["network"].exists():
        add_picture_safe(s, images["network"], PInches(5.5), PInches(0.85), width=PInches(4.2))
    slides_meta.append((s, "wipe"))

    # 12 Other roles
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s)
    accent_bar(s)
    add_title(s, "Other Roles (Brief)", PInches(0.5), PInches(0.25), PInches(9), PInches(0.55), 28, True, P_TEAL)
    add_picture_safe(s, images["icon"], PInches(8.7), PInches(0.2), width=PInches(0.9))
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
        PInches(1.1),
        PInches(8.8),
        PInches(3.5),
        16,
        P_DARK,
    )
    slides_meta.append((s, "push"))

    # 13 Checklist
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s)
    accent_bar(s)
    add_title(s, "Caregiver Practice Checklist", PInches(0.5), PInches(0.25), PInches(9), PInches(0.55), 28, True, P_TEAL)
    add_body(
        s,
        [
            "☐ Install app     ☐ Create account     ☐ Onboard as Caregiver",
            "☐ Explore Home tiles     ☐ Enroll in a free course",
            "☐ Mark a lesson complete     ☐ Read a blog post",
            "☐ Edit profile details     ☐ Optional: Join Network on web",
        ],
        PInches(0.5),
        PInches(1.3),
        PInches(8.8),
        PInches(3.2),
        17,
        P_DARK,
    )
    slides_meta.append((s, "fade"))

    # 14 Close
    s = prs.slides.add_slide(prs.slide_layouts[6])
    style_slide_bg(s, P_TEAL)
    add_picture_safe(s, images["icon"], PInches(4.25), PInches(0.7), width=PInches(1.5))
    add_title(s, "Support & Next Steps", PInches(0.7), PInches(2.4), PInches(8.5), PInches(0.6), 32, True, P_WHITE, PP_ALIGN.CENTER)
    add_title(
        s,
        "In-app: Profile → Help & Support\nWeb: https://mamaplus.co.ke\nThank you — let’s practice on your phones!",
        PInches(0.7),
        PInches(3.2),
        PInches(8.5),
        PInches(1.5),
        16,
        False,
        P_WHITE,
        PP_ALIGN.CENTER,
    )
    slides_meta.append((s, "dissolve"))

    total = len(slides_meta)
    for i, (slide, effect) in enumerate(slides_meta, start=1):
        set_transition(slide, effect=effect, speed="med")
        # Footer on cream slides only
        if i not in (1, total):
            footer(slide, i, total)

    path = OUT / "MamaPlus_Mobile_Training_Presentation_with_Images.pptx"
    prs.save(path)
    desktop = Path.home() / "Desktop" / "MamaPlus_Mobile_Training_Presentation_with_Images.pptx"
    try:
        desktop.write_bytes(path.read_bytes())
    except PermissionError:
        desktop = Path.home() / "Desktop" / f"MamaPlus_Training_{date.today().isoformat()}.pptx"
        desktop.write_bytes(path.read_bytes())
    # Also try updating the original filename if unlocked
    original = OUT / "MamaPlus_Mobile_Training_Presentation.pptx"
    try:
        original.write_bytes(path.read_bytes())
    except PermissionError:
        pass
    print("PPTX:", path)
    print("DESKTOP:", desktop)
    print("TRANSITIONS:", ", ".join(e for _, e in slides_meta))
    print("IMAGES:", {k: v.exists() for k, v in images.items()})


if __name__ == "__main__":
    build()

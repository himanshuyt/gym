import os
import re
from datetime import datetime, timezone
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'gym-body-secret-key-2026')
# Absolute database path so records NEVER vanish on refresh or restart
# Use a hosted Postgres database when DATABASE_URL is set (data survives restarts),
# otherwise fall back to local SQLite for development.
_db_url = os.getenv('DATABASE_URL', '').strip()
if _db_url.startswith('postgres://'):
    _db_url = _db_url.replace('postgres://', 'postgresql://', 1)
app.config['SQLALCHEMY_DATABASE_URI'] = _db_url or f"sqlite:///{os.path.join(BASE_DIR, 'gym_body.db')}"
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {'pool_pre_ping': True, 'pool_recycle': 280}
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class Video(db.Model):
    __tablename__ = 'videos'
    id = db.Column(db.Integer, primary_key=True)
    muscle = db.Column(db.String(100), nullable=False, index=True)
    sub_category = db.Column(db.String(100), nullable=True) # e.g. "Upper Chest", "Incline", "Short Head"
    title = db.Column(db.String(200), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    platform = db.Column(db.String(20), default="youtube") # "youtube" or "instagram"
    added_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<Video {self.title} ({self.muscle})>"

# ---------------------------------------------------------------------------
# URL & Jinja2 Helper Utilities
# ---------------------------------------------------------------------------
def parse_media_url(url: str):
    """
    Detect platform (YouTube or Instagram) and convert to clean embed URL.
    Returns (embed_url, platform)
    """
    if not url:
        return ("", "youtube")
    url = url.strip()

    # Instagram Reels / Posts
    # Matches: instagram.com/reel/CODE/, instagram.com/reels/CODE/, instagram.com/p/CODE/
    insta_match = re.search(r'instagram\.com/(?:reel|reels|p)/([a-zA-Z0-9_-]+)', url)
    if insta_match:
        code = insta_match.group(1)
        return (f"https://www.instagram.com/reel/{code}/embed/", "instagram")

    # YouTube Shorts
    yt_shorts = re.search(r'youtube\.com/shorts/([a-zA-Z0-9_-]+)', url)
    if yt_shorts:
        return (f"https://www.youtube.com/embed/{yt_shorts.group(1)}", "youtube")

    # YouTube standard watch?v=
    yt_watch = re.search(r'[?&]v=([a-zA-Z0-9_-]+)', url)
    if yt_watch:
        return (f"https://www.youtube.com/embed/{yt_watch.group(1)}", "youtube")

    # youtu.be/<id>
    yt_short = re.search(r'youtu\.be/([a-zA-Z0-9_-]+)', url)
    if yt_short:
        return (f"https://www.youtube.com/embed/{yt_short.group(1)}", "youtube")

    # If already an embed URL
    if "youtube.com/embed/" in url:
        return (url, "youtube")
    if "instagram.com" in url and "/embed" in url:
        return (url, "instagram")

    # Fallback
    return (url, "youtube")

@app.template_filter('embed_url')
def embed_url_filter(url):
    embed, _ = parse_media_url(url)
    return embed

@app.template_filter('timeago')
def timeago_filter(dt):
    if dt is None:
        return "recently"
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    diff = now - dt
    seconds = int(diff.total_seconds())
    if seconds < 0:
        return "just now"
    if seconds < 60:
        return f"{seconds}s ago"
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes}m ago"
    hours = minutes // 60
    if hours < 24:
        return f"{hours}h ago"
    days = hours // 24
    if days < 30:
        return f"{days}d ago"
    months = days // 30
    return f"{months}mo ago"

@app.context_processor
def inject_globals():
    return {'now': datetime.now}

# ---------------------------------------------------------------------------
# Comprehensive Seed Exercises (Different Forms, Angles & Instagram Reels)
# ---------------------------------------------------------------------------
DEFAULT_EXERCISES = [
    # --- UPPER CHEST (Clavicular Head) ---
    {"muscle": "Upper Chest", "sub": "Incline Dumbbell", "title": "Incline Dumbbell Press (30° Angle for Upper Chest)", "url": "https://www.youtube.com/watch?v=8iPEnn-ltC8"},
    {"muscle": "Upper Chest", "sub": "Incline Barbell", "title": "Incline Barbell Bench Press (3 Golden Rules)", "url": "https://www.youtube.com/watch?v=SrqOu55lrYU"},
    {"muscle": "Upper Chest", "sub": "Cable Low-to-High", "title": "Low to High Cable Fly (Upper Chest Perfect Form)", "url": "https://www.youtube.com/watch?v=eQ_NBB6OBH4"},
    {"muscle": "Upper Chest", "sub": "Insta Reel Form", "title": "Instagram Workout: Upper Chest Growth Routine", "url": "https://www.instagram.com/reel/C3bW7cRLQ4P/"},

    # --- LOWER & MID CHEST (Sternal Head) ---
    {"muscle": "Chest", "sub": "Flat Barbell", "title": "Flat Barbell Bench Press Complete Masterclass", "url": "https://www.youtube.com/watch?v=rT7DgCr-3pg"},
    {"muscle": "Chest", "sub": "Weighted Dips", "title": "Chest Dips (Forward Lean for Lower Pecs)", "url": "https://www.youtube.com/watch?v=2z8JmcrW-As"},
    {"muscle": "Chest", "sub": "High-to-Low Cable", "title": "High to Low Cable Crossover for Lower Chest", "url": "https://www.youtube.com/watch?v=Iwe6AmxVf7o"},
    {"muscle": "Chest", "sub": "Insta Reel Form", "title": "Instagram Reel: 3 Best Angles for Overall Chest", "url": "https://www.instagram.com/reel/C5sKqXwL6V9/"},

    # --- SHOULDERS / DELTOIDS (Front, Lateral, Rear) ---
    {"muscle": "Side Delts", "sub": "Dumbbell Lateral", "title": "Dumbbell Lateral Raises (Pinkies Up vs Neutral)", "url": "https://www.youtube.com/watch?v=3VcKaXpzqRo"},
    {"muscle": "Side Delts", "sub": "Cable Egyptian", "title": "Lean-Away Cable Lateral Raises (Constant Tension)", "url": "https://www.youtube.com/watch?v=PPrzBWZDOhA"},
    {"muscle": "Front Delts", "sub": "Overhead Press", "title": "Seated Overhead Dumbbell Shoulder Press", "url": "https://www.youtube.com/watch?v=2yjwXTZQDDI"},
    {"muscle": "Rear Delts", "sub": "Face Pulls", "title": "Cable Face Pulls with External Rotation", "url": "https://www.youtube.com/watch?v=rep-qVOkqgk"},
    {"muscle": "Rear Delts", "sub": "Reverse Fly", "title": "Dumbbell Rear Fly 2.0 (Capped Shoulders)", "url": "https://www.youtube.com/watch?v=iXv1Wugjurc"},

    # --- BICEPS (Long Head, Short Head, Brachialis) ---
    {"muscle": "Biceps", "sub": "Incline Curl (Long Head)", "title": "Incline Dumbbell Curl for Bicep Peak (Long Head)", "url": "https://www.youtube.com/watch?v=soxrZlIl35U"},
    {"muscle": "Biceps", "sub": "Preacher Curl (Short Head)", "title": "Preacher Curl for Massive Bicep Width", "url": "https://www.youtube.com/watch?v=fIWP-FRFNU0"},
    {"muscle": "Biceps", "sub": "Hammer Curls", "title": "Cross-Body Hammer Curls for Brachialis & Thickness", "url": "https://www.youtube.com/watch?v=zC3nLlEvin4"},
    {"muscle": "Biceps", "sub": "Insta Reel Tip", "title": "Instagram Reel: The 1 Secret to Bigger Bicep Peaks", "url": "https://www.instagram.com/reel/C4rM8f2LK_X/"},

    # --- TRICEPS (Long Head, Lateral Head, Medial) ---
    {"muscle": "Triceps", "sub": "Overhead Extension", "title": "Dumbbell Seated Overhead Tricep Extension", "url": "https://www.youtube.com/watch?v=YbX7Wd8jQ-Q"},
    {"muscle": "Triceps", "sub": "Rope Pushdown", "title": "Tricep Cable Pushdown (Flaring at Bottom)", "url": "https://www.youtube.com/watch?v=vB5OHsJ3EME"},
    {"muscle": "Triceps", "sub": "Skull Crushers", "title": "Incline EZ-Bar Skull Crushers Form", "url": "https://www.youtube.com/watch?v=d_KZxkY_0cM"},

    # --- BACK / LATS (Width vs Thickness) ---
    {"muscle": "Lats", "sub": "Lat Pulldown (Width)", "title": "Wide Grip Lat Pulldown Complete Form Guide", "url": "https://www.youtube.com/watch?v=CAwf7n6Luuc"},
    {"muscle": "Lats", "sub": "Single-Arm Cable", "title": "Standing Cable Lat Pushdown (Lat Width)", "url": "https://www.youtube.com/watch?v=AjCCGN2tU3Q"},
    {"muscle": "Upper Back", "sub": "Barbell Rows (Thickness)", "title": "Barbell Bent-Over Row (Strict Form)", "url": "https://www.youtube.com/watch?v=9efgcAjQe7E"},
    {"muscle": "Upper Back", "sub": "Chest-Supported", "title": "Incline Bench Dumbbell Row (Zero Lower Back Strain)", "url": "https://www.youtube.com/watch?v=H75im9fAUMc"},
    {"muscle": "Lower Back", "sub": "Hyperextensions", "title": "45° Back Hyperextension for Spinal Erectors", "url": "https://www.youtube.com/watch?v=ph3pddpKzzw"},

    # --- ABDOMINALS (Upper, Lower, Obliques) ---
    {"muscle": "Upper Abs", "sub": "Cable Crunch", "title": "Kneeling Cable Crunch / Ab Pulldown", "url": "https://www.youtube.com/watch?v=2fbujeH3F0E"},
    {"muscle": "Lower Abs", "sub": "Hanging Leg Raise", "title": "Hanging Leg Raises with Pelvic Tilt (Lower Abs)", "url": "https://www.youtube.com/watch?v=Pr1ieGZ5atk"},
    {"muscle": "Obliques", "sub": "Woodchoppers", "title": "High-to-Low Cable Woodchopper for Obliques", "url": "https://www.youtube.com/watch?v=pAplQXk3dkU"},

    # --- LEGS: QUADS & HAMSTRINGS ---
    {"muscle": "Quads", "sub": "Barbell Squats", "title": "High Bar vs Low Bar Squats (Quad Dominance)", "url": "https://www.youtube.com/watch?v=bEv6CCg2BC8"},
    {"muscle": "Quads", "sub": "Leg Extension", "title": "Leg Extension with 2-Sec Pause for Teardrop (VMO)", "url": "https://www.youtube.com/watch?v=YyvSfVjQeL0"},
    {"muscle": "Quads", "sub": "Bulgarian Split", "title": "Bulgarian Split Squat (Quad Focused Upright Torso)", "url": "https://www.youtube.com/watch?v=2C-uNgKwPLE"},
    {"muscle": "Hamstrings", "sub": "Romanian Deadlift", "title": "Dumbbell Romanian Deadlift (Hip Hinge Focus)", "url": "https://www.youtube.com/watch?v=JCXUYuzwNrM"},
    {"muscle": "Hamstrings", "sub": "Lying Leg Curl", "title": "Lying Leg Curl (Dorsiflexed Ankles for Tension)", "url": "https://www.youtube.com/watch?v=1Tq3QdYUuHs"},

    # --- GLUTES & CALVES ---
    {"muscle": "Glutes", "sub": "Barbell Hip Thrust", "title": "Barbell Hip Thrust Setup & Proper Form", "url": "https://www.youtube.com/watch?v=LM8XHLYJoYs"},
    {"muscle": "Glutes", "sub": "Cable Kickbacks", "title": "Cable Glute Kickbacks & Volumizing Routine", "url": "https://www.youtube.com/watch?v=wfkml2LJbxQ"},
    {"muscle": "Calves", "sub": "Standing Raise", "title": "Standing Calf Raise (Gastrocnemius Muscle Focus)", "url": "https://www.youtube.com/watch?v=-M4-G8p8fmc"},
    {"muscle": "Calves", "sub": "Seated Raise", "title": "Seated Calf Raise (Soleus Muscle Deep Growth)", "url": "https://www.youtube.com/watch?v=JbyjNymZOt0"},

    # --- TRAPS & FOREARMS ---
    {"muscle": "Traps", "sub": "Dumbbell Shrugs", "title": "Dumbbell Shrugs (Slight Forward Lean for Traps)", "url": "https://www.youtube.com/watch?v=cJRVVxmytaM"},
    {"muscle": "Forearms", "sub": "Wrist Flexion", "title": "Forearm Wrist Curls & Reverse Forearm Workout", "url": "https://www.youtube.com/watch?v=8nXToWFIxZI"},
]

def seed_database_if_empty():
    """Seeds rich exercises if table is empty. Existing user additions are preserved!"""
    if Video.query.count() == 0:
        for ex in DEFAULT_EXERCISES:
            embed_url, platform = parse_media_url(ex["url"])
            db.session.add(Video(
                muscle=ex["muscle"],
                sub_category=ex.get("sub", ""),
                title=ex["title"],
                url=embed_url,
                platform=platform
            ))
        db.session.commit()

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route('/')
def index():
    """Main page – 3D 360° interactive realistic body with granular muscle targets."""
    muscles_query = db.session.query(Video.muscle, db.func.count(Video.id)).group_by(Video.muscle).all()
    muscle_counts = {m[0]: m[1] for m in muscles_query}
    return render_template('index.html', muscle_counts=muscle_counts)

@app.route('/videos/<muscle>')
def videos(muscle):
    """Show all videos for a specific muscle group."""
    vids = Video.query.filter(Video.muscle.ilike(muscle)).order_by(Video.added_at.desc()).all()
    return render_template('videos.html', muscle=muscle, videos=vids)

@app.route('/admin/add', methods=['GET', 'POST'])
def add_video():
    """Add a new exercise video or Instagram Reel."""
    if request.method == 'POST':
        muscle = request.form.get('muscle', '').strip()
        sub_cat = request.form.get('sub_category', '').strip()
        title = request.form.get('title', '').strip()
        raw_url = request.form.get('url', '').strip()
        
        if not (muscle and title and raw_url):
            flash('Please fill in all required fields.', 'danger')
            return redirect(url_for('add_video'))
        
        embed_url, platform = parse_media_url(raw_url)
        new_vid = Video(muscle=muscle, sub_category=sub_cat, title=title, url=embed_url, platform=platform)
        db.session.add(new_vid)
        db.session.commit()
        flash(f'Success! {platform.title()} exercise "{title}" added for {muscle}.', 'success')
        return redirect(url_for('videos', muscle=muscle))
    
    muscles = [m[0] for m in db.session.query(Video.muscle).distinct().all()]
    standard_muscles = [
        "Upper Chest", "Chest", "Front Delts", "Side Delts", "Rear Delts",
        "Biceps", "Triceps", "Forearms", "Upper Abs", "Lower Abs", "Obliques",
        "Lats", "Upper Back", "Lower Back", "Quads", "Hamstrings", "Glutes", "Calves", "Traps"
    ]
    all_muscles = sorted(list(set(muscles + standard_muscles)))
    return render_template('add_video.html', muscles=all_muscles)

# ---------------------------------------------------------------------------
# REST API Endpoints (Fast, zero-lag AJAX for 3D body interaction)
# ---------------------------------------------------------------------------
@app.route('/api/videos')
def api_videos():
    muscle = request.args.get('muscle', '').strip()
    if not muscle:
        return jsonify([])
    
    # Support grouping (e.g. "Chest" can match both "Chest" and "Upper Chest" if desired)
    query = Video.query.filter(
        (Video.muscle.ilike(muscle)) | 
        (Video.muscle.ilike(f"%{muscle}%"))
    ).order_by(Video.added_at.desc()).all()

    data = [
        {
            'id': v.id,
            'muscle': v.muscle,
            'sub_category': v.sub_category or '',
            'title': v.title,
            'url': v.url,
            'platform': v.platform or ('instagram' if 'instagram.com' in v.url else 'youtube'),
            'added_at': v.added_at.strftime("%b %d, %Y") if v.added_at else "Recently"
        }
        for v in query
    ]
    return jsonify(data)

@app.route('/api/add-video', methods=['POST'])
def api_add_video():
    """Adds exercise video or Instagram Reel via AJAX with permanent SQLite persistence."""
    data = request.get_json() or {}
    muscle = data.get('muscle', '').strip()
    sub_cat = data.get('sub_category', '').strip()
    title = data.get('title', '').strip()
    raw_url = data.get('url', '').strip()

    if not (muscle and title and raw_url):
        return jsonify({'success': False, 'error': 'All fields are required.'}), 400

    embed_url, platform = parse_media_url(raw_url)
    new_vid = Video(
        muscle=muscle,
        sub_category=sub_cat,
        title=title,
        url=embed_url,
        platform=platform
    )
    db.session.add(new_vid)
    db.session.commit()

    return jsonify({
        'success': True,
        'video': {
            'id': new_vid.id,
            'muscle': new_vid.muscle,
            'sub_category': new_vid.sub_category or '',
            'title': new_vid.title,
            'url': new_vid.url,
            'platform': new_vid.platform,
            'added_at': 'Just now'
        }
    })

@app.route('/api/muscles')
def api_muscles():
    counts = db.session.query(Video.muscle, db.func.count(Video.id)).group_by(Video.muscle).all()
    return jsonify({m[0]: m[1] for m in counts})

# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
with app.app_context():
    db.create_all()
    seed_database_if_empty()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
// Leaves a faint, fading watercolor wash behind the brush cursor,
// with the occasional fleck of gold.
(function () {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var LIFE = 550;       // ms a dab stays visible
    var RADIUS = 12;      // px
    var SPACING = 6;      // px between dabs along the stroke
    var PEAK = 0.1;       // opacity of a fresh dab

    var canvas = document.createElement('canvas');
    canvas.className = 'brush-trail';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var dpr = 1;

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
    }
    resize();
    window.addEventListener('resize', resize);

    // One soft dab, reused for every point on the trail.
    var dab = document.createElement('canvas');
    dab.width = dab.height = RADIUS * 2;
    var dctx = dab.getContext('2d');
    var g = dctx.createRadialGradient(RADIUS, RADIUS, 0, RADIUS, RADIUS, RADIUS);
    g.addColorStop(0, 'rgba(203, 150, 128, 1)');
    g.addColorStop(0.45, 'rgba(203, 168, 154, 0.5)');
    g.addColorStop(1, 'rgba(203, 168, 154, 0)');
    dctx.fillStyle = g;
    dctx.fillRect(0, 0, RADIUS * 2, RADIUS * 2);

    // A smaller, warmer dab that runs down the middle of the stroke.
    var GOLD_R = 7;
    var gold = document.createElement('canvas');
    gold.width = gold.height = GOLD_R * 2;
    var gctx = gold.getContext('2d');
    var gg = gctx.createRadialGradient(GOLD_R, GOLD_R, 0, GOLD_R, GOLD_R, GOLD_R);
    gg.addColorStop(0, 'rgba(236, 196, 104, 1)');
    gg.addColorStop(0.5, 'rgba(232, 190, 110, 0.45)');
    gg.addColorStop(1, 'rgba(232, 190, 110, 0)');
    gctx.fillStyle = gg;
    gctx.fillRect(0, 0, GOLD_R * 2, GOLD_R * 2);

    var points = [];
    var sparks = [];
    var SPARK_LIFE = 650;
    var last = null;
    var running = false;

    function frame(now) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        while (points.length && now - points[0].t > LIFE) points.shift();
        for (var i = 0; i < points.length; i++) {
            var p = points[i];
            var life = 1 - (now - p.t) / LIFE;
            ctx.globalAlpha = PEAK * life * life;
            var r = RADIUS * (1.25 - 0.25 * life);   // wash spreads a little as it dries
            ctx.drawImage(dab, p.x - r, p.y - r, r * 2, r * 2);
            ctx.globalAlpha = 0.16 * life * life;
            ctx.drawImage(gold, p.x - GOLD_R, p.y - GOLD_R);
        }
        while (sparks.length && now - sparks[0].t > SPARK_LIFE) sparks.shift();
        for (var j = 0; j < sparks.length; j++) {
            var s = sparks[j];
            var sl = 1 - (now - s.t) / SPARK_LIFE;
            var twinkle = 0.55 + 0.45 * Math.sin(now / 90 + s.phase);
            var len = s.size * (0.6 + 0.4 * twinkle);
            ctx.globalAlpha = sl * twinkle * 0.35;
            ctx.drawImage(gold, s.x - len * 1.5, s.y - len * 1.5, len * 3, len * 3);
            ctx.globalAlpha = sl * twinkle;
            ctx.strokeStyle = '#dcaa3e';
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            ctx.moveTo(s.x - len, s.y); ctx.lineTo(s.x + len, s.y);
            ctx.moveTo(s.x, s.y - len); ctx.lineTo(s.x, s.y + len);
            ctx.stroke();
            ctx.fillStyle = '#fff3cf';
            ctx.beginPath();
            ctx.arc(s.x, s.y, 0.7, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        if (points.length || sparks.length) {
            requestAnimationFrame(frame);
        } else {
            running = false;
        }
    }

    window.addEventListener('mousemove', function (e) {
        var now = performance.now();
        var x = e.clientX, y = e.clientY;
        if (!last || now - last.t > 200) {
            last = { x: x, y: y, t: now };
            return;
        }
        var dx = x - last.x, dy = y - last.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < SPACING) return;
        var steps = Math.min(Math.floor(dist / SPACING), 40);
        for (var i = 1; i <= steps; i++) {
            var px = last.x + dx * i / steps, py = last.y + dy * i / steps;
            points.push({ x: px, y: py, t: now });
            if (Math.random() < 0.3) {
                sparks.push({
                    x: px + (Math.random() - 0.5) * RADIUS * 1.4,
                    y: py + (Math.random() - 0.5) * RADIUS * 1.4,
                    t: now,
                    size: 2 + Math.random() * 3,
                    phase: Math.random() * 6.28
                });
            }
        }
        last = { x: x, y: y, t: now };
        if (!running) {
            running = true;
            requestAnimationFrame(frame);
        }
    }, { passive: true });
})();

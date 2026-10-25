/**
 * Canvas Confetti integration for Fasnet 2027
 * Self-contained, lightweight, zero-dependency celebration effects
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.confetti = factory();
  }
})(this, function () {
  var defaultColors = ['#0b50bd', '#f2b42c', '#d9242a', '#ff8c2b', '#ffffff', '#00d2ff'];

  function createConfettiCanvas() {
    var canvas = document.getElementById('confetti-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'confetti-canvas';
      document.body.appendChild(canvas);
    }
    return canvas;
  }

  function ConfettiEngine() {
    var canvas = createConfettiCanvas();
    var ctx = canvas.getContext('2d');
    var particles = [];
    var animationFrame = null;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    function Particle(x, y, vx, vy, color, size, rotation, vRot) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.color = color;
      this.size = size;
      this.rotation = rotation;
      this.vRot = vRot;
      this.opacity = 1;
      this.life = 1;
      this.decay = 0.006 + Math.random() * 0.006;
    }

    Particle.prototype.update = function () {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.28; // gravity
      this.vx *= 0.99; // drag
      this.rotation += this.vRot;
      this.life -= this.decay;
      this.opacity = Math.max(0, this.life);
    };

    Particle.prototype.draw = function (context) {
      context.save();
      context.translate(this.x, this.y);
      context.rotate(this.rotation);
      context.globalAlpha = this.opacity;
      context.fillStyle = this.color;
      // Draw rectangular confetti snippet
      context.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
      context.restore();
    };

    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.update();
        p.draw(ctx);
        if (p.life <= 0 || p.y > canvas.height + 50) {
          particles.splice(i, 1);
        }
      }

      if (particles.length > 0) {
        animationFrame = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    }

    return {
      fire: function (opts) {
        opts = opts || {};
        var count = opts.count || 70;
        var originX = (opts.origin && opts.origin.x !== undefined) ? opts.origin.x * canvas.width : canvas.width / 2;
        var originY = (opts.origin && opts.origin.y !== undefined) ? opts.origin.y * canvas.height : canvas.height / 3;
        var colors = opts.colors || defaultColors;

        for (var i = 0; i < count; i++) {
          var angle = (opts.angle !== undefined ? opts.angle : 90) * (Math.PI / 180);
          var spread = (opts.spread || 80) * (Math.PI / 180);
          var pAngle = angle - spread / 2 + Math.random() * spread;
          var velocity = 8 + Math.random() * 16;
          var vx = Math.cos(pAngle) * velocity * (opts.directionX || 1);
          var vy = -Math.sin(pAngle) * velocity;
          var color = colors[Math.floor(Math.random() * colors.length)];
          var size = 10 + Math.random() * 8;
          var rot = Math.random() * Math.PI * 2;
          var vRot = (Math.random() - 0.5) * 0.2;

          particles.push(new Particle(originX, originY, vx, vy, color, size, rot, vRot));
        }

        if (!animationFrame) {
          animationFrame = requestAnimationFrame(loop);
        }
      }
    };
  }

  var engine = null;
  function getEngine() {
    if (!engine) {
      engine = ConfettiEngine();
    }
    return engine;
  }

  return {
    fire: function (opts) {
      getEngine().fire(opts);
    },
    burst: function () {
      // Dual side cannons
      getEngine().fire({ count: 50, origin: { x: 0.1, y: 0.8 }, angle: 60, spread: 55 });
      getEngine().fire({ count: 50, origin: { x: 0.9, y: 0.8 }, angle: 120, spread: 55 });
    },
    festiveRain: function () {
      // Top celebration shower
      getEngine().fire({ count: 90, origin: { x: 0.5, y: 0.1 }, angle: 270, spread: 140 });
    },
    doubleDrop: function () {
      var self = this;
      // 1st Confetti Drop
      self.festiveRain();
      self.burst();

      // 2nd Confetti Drop in a row (after 750ms)
      setTimeout(function () {
        self.festiveRain();
        self.burst();
      }, 750);
    }
  };
});

// Setup global helpers and auto-triggers
document.addEventListener('DOMContentLoaded', function () {
  // Setup confetti buttons
  var confettiButtons = document.querySelectorAll('[data-action="confetti"]');
  confettiButtons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (window.confetti) {
        window.confetti.burst();
      }
    });
  });

  // When entering the website (main page or petzen page), drop 2 times in a row confetti as default
  setTimeout(function () {
    if (window.confetti && typeof window.confetti.doubleDrop === 'function') {
      window.confetti.doubleDrop();
    } else if (window.confetti) {
      window.confetti.burst();
      setTimeout(function () {
        window.confetti.burst();
      }, 750);
    }
  }, 400);
});

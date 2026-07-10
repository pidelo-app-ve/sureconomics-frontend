import { Link } from "react-router-dom";
import { PostCard } from "./PostCard";
import { BRAND } from "../../data/surEconomicsMock";
import PropTypes from "prop-types";

export const Hero = ({ featuredPost }) => {
  const heroClaim = "Análisis y perspectiva sobre economía, mercados e inversión en la región.";
  return (
    <section className="se-hero" aria-label="Destacado principal">
      <div className="se-hero__charts" aria-hidden="true">
        <svg
          className="se-hero__charts-svg"
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
          role="presentation"
          focusable="false"
        >
          <defs>
            <linearGradient id="seHeroChartFade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="12%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="88%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <mask id="seHeroChartMask">
              <rect x="0" y="0" width="1200" height="600" fill="url(#seHeroChartFade)" />
            </mask>
          </defs>

          <g mask="url(#seHeroChartMask)">
            {/* Baseline micro ticks */}
            <g className="se-hero__ticks" opacity="0.55">
              {Array.from({ length: 36 }).map((_, i) => (
                <line
                  key={i}
                  x1={40 + i * 32}
                  y1={520}
                  x2={40 + i * 32}
                  y2={i % 3 === 0 ? 496 : 506}
                  className="se-hero__tick"
                />
              ))}
            </g>

            {/* Candle cluster */}
            <g className="se-hero__candles" opacity="0.55">
              {[
                { x: 160, y: 380, h: 92 },
                { x: 208, y: 344, h: 128 },
                { x: 256, y: 362, h: 110 },
                { x: 304, y: 316, h: 156 },
                { x: 352, y: 338, h: 134 },
                { x: 400, y: 292, h: 180 },
                { x: 448, y: 310, h: 164 },
                { x: 496, y: 262, h: 208 },
                { x: 544, y: 286, h: 186 },
                { x: 592, y: 244, h: 222 },
                { x: 640, y: 268, h: 200 },
                { x: 688, y: 236, h: 232 },
              ].map((c, idx) => (
                <g key={c.x} className="se-hero__candle" style={{ ["--i"]: idx }}>
                  <line x1={c.x + 10} y1={c.y - 20} x2={c.x + 10} y2={c.y + c.h + 22} className="se-hero__wick" />
                  <rect x={c.x} y={c.y} width="20" height={c.h} rx="4" className="se-hero__body" />
                </g>
              ))}
            </g>

            {/* Price lines */}
            <g className="se-hero__lines">
              <path
                className="se-hero__line se-hero__line--accent"
                d="M 40 430 L 120 410 L 180 445 L 240 396 L 300 408 L 360 368 L 420 382 L 480 340 L 540 354 L 600 320 L 660 338 L 720 300 L 780 316 L 840 274 L 900 292 L 960 258 L 1040 268 L 1120 244"
              />
              <path
                className="se-hero__line se-hero__line--neutral"
                d="M 60 468 L 140 486 L 210 460 L 270 492 L 330 452 L 390 472 L 450 438 L 510 460 L 570 420 L 630 448 L 690 404 L 750 430 L 810 392 L 870 414 L 930 380 L 1000 402 L 1100 372"
              />
              <path
                className="se-hero__line se-hero__line--neutral se-hero__line--thin"
                d="M 90 320 L 170 300 L 230 334 L 290 286 L 350 306 L 410 268 L 470 290 L 530 248 L 590 274 L 650 234 L 710 258 L 770 214 L 830 244 L 890 206 L 950 228 L 1030 200 L 1120 216"
              />
            </g>
          </g>
        </svg>
      </div>
      <div className="se-container">
        <div className="se-hero__text">
          <h1 className="se-heading-hero">{BRAND.name.replace(/([a-z])([A-Z])/, "$1​$2")}</h1>
          <p className="se-text-lead se-hero__claim">{heroClaim}</p>
          <p className="se-text-body se-hero__description">{BRAND.description}</p>
          <div className="se-hero__actions">
            <Link to="/articulos" className="se-btn">
              Explorar artículos
            </Link>
            <Link to="/suscribirse" className="se-btn se-btn--secondary">
              Acceso premium
            </Link>
          </div>
        </div>
        <div className="se-hero__featured">
          {featuredPost ? (
            <PostCard
              slug={featuredPost.slug}
              category={featuredPost.category}
              title={featuredPost.title}
              excerpt={featuredPost.excerpt}
              date={featuredPost.date}
              readTime={featuredPost.readTime}
              imagePlaceholder={featuredPost.imagePlaceholder}
              imageUrl={featuredPost.imageUrl}
              author={featuredPost.author}
              variant="hero"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
};

Hero.propTypes = {
  featuredPost: PropTypes.shape({
    id: PropTypes.string,
    slug: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    excerpt: PropTypes.string,
    date: PropTypes.string,
    category: PropTypes.string,
    author: PropTypes.string,
    imageUrl: PropTypes.string,
    imagePlaceholder: PropTypes.oneOf(["chart", "building", "growth"]),
    readTime: PropTypes.string,
  }),
};

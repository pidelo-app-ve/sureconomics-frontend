import { useEffect, useState } from "react";
import { getMarketTicker } from "../../services/marketTickerService";

/**
 * Market strip: the closing figures the newsroom typed in.
 *
 * There is no market feed in this project, so the caption is not decoration — it is
 * what stops a row of numbers from reading as live data. If there is no caption and
 * no figures, the strip renders **nothing at all**: an empty scroller, or worse a
 * row of placeholder zeros, would be a claim nobody made.
 *
 * The list is rendered twice so the marquee can loop without a visible seam.
 */
export const MarketTicker = () => {
  const [ticker, setTicker] = useState(null);

  useEffect(() => {
    let alive = true;
    getMarketTicker()
      .then((data) => {
        if (alive) setTicker(data);
      })
      .catch(() => {
        // A strip that cannot load is a strip that shows nothing. It is ambient
        // context, not content, so it must never become an error message across
        // the top of every page.
        if (alive) setTicker(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!ticker?.indicators?.length) return null;

  const run = ticker.indicators.map((item, i) => (
    <span className="se-ticker__item" key={`${item.label}-${i}`}>
      <span className="se-ticker__k">{item.label}</span>
      <span className={`se-ticker__v se-ticker__v--${item.direction}`}>{item.value}</span>
    </span>
  ));

  return (
    <div className="se-ticker" aria-label="Cifras de cierre de mercado">
      <div className="se-ticker__viewport">
        <div className="se-ticker__track">
          <div className="se-ticker__run">{run}</div>
          <div className="se-ticker__run" aria-hidden="true">
            {run}
          </div>
        </div>
      </div>
      {ticker.caption ? (
        ticker.sourceUrl ? (
          <a
            className="se-ticker__stamp"
            href={ticker.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            {ticker.caption}
            <span aria-hidden="true"> ↗</span>
          </a>
        ) : (
          <span className="se-ticker__stamp">{ticker.caption}</span>
        )
      ) : null}
    </div>
  );
};

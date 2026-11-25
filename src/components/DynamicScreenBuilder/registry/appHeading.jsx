/**
 * The app's own <Heading /> as a component's title bar.
 *
 * A table, a card list, a chart, a record view each drew a title strip of
 * their own, and none of them looked like the heading every hand-coded page
 * (and a built Card) uses. This is that heading, once: the classic skin's card
 * header with its theme line, or the modern Aurora bar — whichever is on.
 *
 * `right` is the component's own tools (count, search, view switch, refresh),
 * drawn on the heading's right side instead of a row of their own. The count
 * goes in Aurora's chip; the classic heading has none, so there it is a pill
 * beside the title.
 */
import React, { useContext } from "react";
import ProjectHeading from "@app/components/UI/Heading";
import { DesignContext } from "@app/providers/DesignProvider";
import Icon from "./icons";

/**
 * `countLabel` puts the count on the RIGHT, as "Total Records : 514", ahead of
 * the tools — the way the list headings on the hand-coded pages read. Without
 * it the count sits beside the title.
 */
export default function AppHeading({ title, icon, count, countLabel, right, color, className = "", onClick }) {
  const isModern = !!useContext(DesignContext)?.isModern;
  const hasCount = count !== undefined && count !== null && count !== "";
  const countRight = hasCount && countLabel !== undefined && countLabel !== null;
  const rightNode =
    countRight || right ? (
      <>
        {countRight ? (
          <span className="dsb-apphead-count">
            {countLabel ? <span className="dsb-apphead-sub">{countLabel}</span> : null}
            <span className="dsb-count-pill">{count}</span>
          </span>
        ) : null}
        {right}
      </>
    ) : null;
  const titleNode =
    !isModern && hasCount && !countRight ? (
      <span className="dsb-apphead-title">
        {title}
        <span className="dsb-count-pill">{count}</span>
      </span>
    ) : (
      title
    );
  return (
    <div className={`dsb-apphead ${className}`.trim()}>
      <ProjectHeading
        title={titleNode}
        icon={icon ? <Icon name={icon} size={15} /> : undefined}
        count={isModern && hasCount && !countRight ? count : undefined}
        color={color}
        onClick={onClick}
        secondTitle={
          rightNode ? (
            <span className="dsb-apphead-right" data-dsb-interactive>
              {rightNode}
            </span>
          ) : undefined
        }
      />
    </div>
  );
}

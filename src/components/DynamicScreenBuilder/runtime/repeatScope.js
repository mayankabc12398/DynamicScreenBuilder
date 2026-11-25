/**
 * The record a repeating component hands the template it draws once per item.
 *
 * A Card List keeps ONE set of child nodes and renders them once per record.
 * The children are ordinary nodes, so the only thing that differs between the
 * copies is the row they stand on — and that row cannot travel as a prop,
 * because the same child elements are reused for every card (and the JSX
 * export hands them over as a slot rather than as NodeRenderers).
 *
 * So the repeater wraps each copy in this provider and the NodeRenderer
 * directly under it reads it:
 *
 *   row      the record this copy stands on — becomes {{row.*}} for the
 *            child and, through the normal `row` prop, for everything below it
 *   preview  canvas only: this copy is a look-alike of the template card, so
 *            it renders without selection chrome (the first card is the one
 *            that is edited; selecting a node that appears twelve times would
 *            be twelve outlines for one thing)
 *
 * The consuming node resets the context for its own subtree, so a modal or a
 * nested list further down keeps the row it was handed rather than this one.
 */
import { createContext } from "react";

export const RepeatContext = createContext(null);

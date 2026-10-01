import { useRef, useState, type RefObject } from "react";
import { ChevronDown, X } from "lucide-react";
import { RESOURCE_TYPE_LABELS } from "@/lib/resourceTypes";
import type { Collection, ResourceType } from "@/lib/types";
import type { BookmarkDraft, BookmarkDraftErrors } from "./bookmarkDraft";
import { RESOURCE_TYPES } from "@/lib/types";

// Field set shared by the save and edit dialogs.

function normalizeTag(raw: string) {
  return raw.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "-");
}

function TagEditor({
  id,
  onChange,
  tags,
}: {
  id: string;
  onChange: (tags: string[]) => void;
  tags: string[];
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function commit(raw = input) {
    const additions = raw.split(",").map(normalizeTag).filter(Boolean);
    if (additions.length > 0) {
      onChange(Array.from(new Set([...tags, ...additions])));
    }
    setInput("");
  }

  return (
    <div className="tag-editor" onClick={() => inputRef.current?.focus()}>
      {tags.map((tag) => (
        <span key={tag} className="tag">
          {tag}
          <button
            type="button"
            className="tag-remove"
            onClick={(e) => {
              e.stopPropagation();
              onChange(tags.filter((t) => t !== tag));
            }}
            aria-label={`Remove tag ${tag}`}
          >
            <X size={11} strokeWidth={2} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        id={id}
        type="text"
        name="tags"
        autoComplete="off"
        spellCheck={false}
        value={input}
        placeholder={tags.length ? "Add another…" : "react, hooks, debugging…"}
        onChange={(e) => {
          const next = e.target.value;
          if (next.includes(",")) commit(next);
          else setInput(next);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Backspace" && !input && tags.length > 0) {
            onChange(tags.slice(0, -1));
          }
        }}
        onBlur={() => commit()}
        aria-describedby={`${id}-hint`}
      />
    </div>
  );
}

type BookmarkFieldsProps = {
  collections: Collection[];
  draft: BookmarkDraft;
  errors: BookmarkDraftErrors;
  idPrefix: string;
  onChange: (patch: Partial<BookmarkDraft>) => void;
  titleRef?: RefObject<HTMLInputElement>;
};

export function BookmarkFields({
  collections,
  draft,
  errors,
  idPrefix,
  onChange,
  titleRef,
}: BookmarkFieldsProps) {
  const id = (name: string) => `${idPrefix}-${name}`;
  const knownType = (RESOURCE_TYPES as readonly string[]).includes(draft.resourceType);

  return (
    <>
      <div className="field">
        <label className="label" htmlFor={id("title")}>
          Title
        </label>
        <input
          ref={titleRef}
          id={id("title")}
          className="input"
          type="text"
          name="title"
          autoComplete="off"
          value={draft.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="What is this page?"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? id("title-error") : undefined}
        />
        {errors.title ? (
          <p id={id("title-error")} className="field-error">
            {errors.title}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label className="label" htmlFor={id("description")}>
          Description <span className="label-optional">Optional</span>
        </label>
        <textarea
          id={id("description")}
          className="textarea"
          name="description"
          rows={3}
          value={draft.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="A line to jog your memory later…"
        />
      </div>

      <div className="field">
        <label className="label" htmlFor={id("tags")}>
          Tags
        </label>
        <TagEditor id={id("tags")} tags={draft.tags} onChange={(tags) => onChange({ tags })} />
        <p id={`${id("tags")}-hint`} className="hint">
          Press Enter or comma to add. Backspace removes the last tag.
        </p>
      </div>

      <div className="form-grid">
        <div className="field">
          <label className="label" htmlFor={id("type")}>
            Type
          </label>
          <div className="select-wrap">
            <select
              id={id("type")}
              className="select"
              name="resourceType"
              value={draft.resourceType}
              onChange={(e) => onChange({ resourceType: e.target.value as ResourceType })}
            >
              {!knownType ? <option value={draft.resourceType}>{draft.resourceType}</option> : null}
              {RESOURCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {RESOURCE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            <ChevronDown size={15} strokeWidth={1.75} aria-hidden="true" />
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor={id("collection")}>
            Collection
          </label>
          <div className="select-wrap">
            <select
              id={id("collection")}
              className="select"
              name="collectionId"
              value={draft.collectionId}
              onChange={(e) => onChange({ collectionId: e.target.value })}
              aria-invalid={errors.collectionId ? true : undefined}
            >
              {collections.length === 0 ? <option value="">No collections yet</option> : null}
              {collections.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name}
                </option>
              ))}
            </select>
            <ChevronDown size={15} strokeWidth={1.75} aria-hidden="true" />
          </div>
          {errors.collectionId ? <p className="field-error">{errors.collectionId}</p> : null}
        </div>
      </div>
    </>
  );
}

import { describe, expect, it } from "vitest"
import {
  parseWikiSchemaDimensions,
  parseWikiSchemaRouting,
  validateWikiPageRouting,
} from "./wiki-schema"

const SCHEMA = `# Wiki Schema

## Page Types

| Type | Directory | Purpose |
| ---- | --------- | ------- |
| source | wiki/sources/ | Source summaries |
| concept | wiki/concepts/ | Ideas |
| method | wiki/methods/ | Methods |
| overview | wiki/ | Top-level overview |
`

describe("parseWikiSchemaRouting", () => {
  it("extracts type directories from the Page Types table", () => {
    const routing = parseWikiSchemaRouting(SCHEMA)

    expect(routing.typeDirs).toEqual({
      source: "wiki/sources",
      concept: "wiki/concepts",
      method: "wiki/methods",
      overview: "wiki",
    })
  })

  it("ignores unrelated markdown tables outside the Page Types section", () => {
    const routing = parseWikiSchemaRouting([
      "# Wiki Schema",
      "",
      "| Name | Directory |",
      "| ---- | --------- |",
      "| draft | wiki/drafts/ |",
      "",
      "## Page Types",
      "",
      "| Type | Directory | Purpose |",
      "| ---- | --------- | ------- |",
      "| concept | wiki/concepts/ | Ideas |",
      "",
      "## Examples",
      "",
      "| Type | Directory |",
      "| ---- | --------- |",
      "| person | wiki/people/ |",
    ].join("\n"))

    expect(routing.typeDirs).toEqual({
      concept: "wiki/concepts",
    })
  })
})

describe("parseWikiSchemaDimensions", () => {
  it("extracts axis value extensions from the Dimensions table", () => {
    const md = [
      "# Wiki Schema",
      "",
      "## Dimensions",
      "",
      "| Axis | Values |",
      "| ---- | ------ |",
      "| layer | marketing, sales, legal |",
      "",
      "## Page Types",
      "",
      "| Type | Directory | Purpose |",
      "| ---- | --------- | ------- |",
      "| concept | wiki/concepts/ | Ideas |",
    ].join("\n")

    expect(parseWikiSchemaDimensions(md).axes).toEqual({
      layer: ["marketing", "sales", "legal"],
    })
  })

  it("returns empty axes when there is no Dimensions section", () => {
    expect(parseWikiSchemaDimensions("# Wiki Schema\n\n## Page Types\n").axes).toEqual({})
  })

  it("ignores the header and separator rows", () => {
    const md = "## Dimensions\n\n| Axis | Values |\n| --- | --- |\n| layer | a, b |\n"
    expect(parseWikiSchemaDimensions(md).axes).toEqual({ layer: ["a", "b"] })
  })
})

describe("validateWikiPageRouting", () => {
  const routing = parseWikiSchemaRouting(SCHEMA)

  it("reports a mismatch between frontmatter type and schema directory", () => {
    const issue = validateWikiPageRouting(
      "wiki/concepts/flash-attention.md",
      [
        "---",
        "type: source",
        "title: Flash Attention",
        "---",
        "",
        "# Flash Attention",
      ].join("\n"),
      routing,
    )

    expect(issue?.message).toContain('type "source" must be under "wiki/sources/"')
  })

  it("allows custom schema types routed by the table", () => {
    expect(
      validateWikiPageRouting(
        "wiki/methods/retrieval.md",
        [
          "---",
          "type: method",
          "title: Retrieval",
          "---",
          "",
          "# Retrieval",
        ].join("\n"),
        routing,
      ),
    ).toBeNull()
  })

  it("does not enforce pages without a parseable type", () => {
    expect(validateWikiPageRouting("wiki/concepts/no-type.md", "# No Type", routing)).toBeNull()
  })
})

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArticlePager } from "@/components/article-pager";
import { makeStoredItem } from "../fixtures/news";

describe("ArticlePager", () => {
  it("renders links to both neighbors", () => {
    render(
      <ArticlePager
        prev={makeStoredItem({ id: "older123", title: "오래된 소식" })}
        next={makeStoredItem({ id: "newer123", title: "새로운 소식" })}
      />,
    );
    expect(screen.getByText("오래된 소식").closest("a")).toHaveAttribute(
      "href",
      "/news/older123",
    );
    expect(screen.getByText("새로운 소식").closest("a")).toHaveAttribute(
      "href",
      "/news/newer123",
    );
    expect(screen.getByText("이전 소식")).toBeInTheDocument();
    expect(screen.getByText("다음 소식")).toBeInTheDocument();
  });

  it("omits a side when the neighbor is missing", () => {
    render(
      <ArticlePager prev={null} next={makeStoredItem({ title: "새로운 소식" })} />,
    );
    expect(screen.queryByText("이전 소식")).not.toBeInTheDocument();
    expect(screen.getByText("다음 소식")).toBeInTheDocument();
  });

  it("renders nothing when there are no neighbors", () => {
    const { container } = render(<ArticlePager prev={null} next={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

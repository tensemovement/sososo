import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NewsCard } from "@/components/news-card";
import { makeStoredItem } from "../fixtures/news";

describe("NewsCard", () => {
  it("renders title, source, and tags", () => {
    render(
      <NewsCard
        item={makeStoredItem({ title: "이웃을 도운 사연", tags: ["나눔", "이웃"] })}
      />,
    );
    expect(screen.getByText("이웃을 도운 사연")).toBeInTheDocument();
    expect(screen.getByText("중앙일보")).toBeInTheDocument();
    expect(screen.getByText("나눔")).toBeInTheDocument();
    expect(screen.getByText("이웃")).toBeInTheDocument();
  });

  it("links to the article detail page", () => {
    render(<NewsCard item={makeStoredItem({ id: "xyz98765" })} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/news/xyz98765");
  });

  it("renders an image when imageUrl is present and omits it otherwise", () => {
    const { container: withImage } = render(
      <NewsCard
        item={makeStoredItem({ imageUrl: "https://picsum.photos/seed/x/800/500" })}
      />,
    );
    expect(withImage.querySelector("img")).not.toBeNull();

    const { container: noImage } = render(
      <NewsCard item={makeStoredItem({ imageUrl: undefined })} />,
    );
    expect(noImage.querySelector("img")).toBeNull();
  });

  it("clamps the dek only when an image is present", () => {
    render(
      <NewsCard
        item={makeStoredItem({
          imageUrl: "https://picsum.photos/seed/x/800/500",
          dek: "이미지가 있는 카드의 요약",
        })}
      />,
    );
    expect(screen.getByText("이미지가 있는 카드의 요약")).toHaveClass("line-clamp-2");

    render(
      <NewsCard
        item={makeStoredItem({ imageUrl: undefined, dek: "이미지가 없는 카드의 요약" })}
      />,
    );
    expect(screen.getByText("이미지가 없는 카드의 요약")).not.toHaveClass(
      "line-clamp-2",
    );
  });
});

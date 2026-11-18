import Image from "next/image";
import type { Post } from "@/types/database";
import { TimeAgo } from "./TimeAgo";

type PostItemProps = {
  post: Post;
  isOwn: boolean;
  highlight?: boolean;
};

export function PostItem({ post, isOwn, highlight = false }: PostItemProps) {
  const isMember = post.user_id !== null;

  return (
    <li
      className={`flex gap-3 border-b border-wall-rule py-3 ${highlight ? "post-enter" : ""}`}
    >
      <Image
        src={isMember ? "/avatar-member.svg" : "/avatar-guest.svg"}
        alt=""
        width={50}
        height={50}
        unoptimized
        className="h-[50px] w-[50px] shrink-0 border border-wall-line"
      />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-bold text-wall-link">{post.author_name}</span>
          {isOwn ? (
            <span className="rounded-sm bg-wall-pale px-1 text-[11px] text-wall-navy">You</span>
          ) : (
            <span className="text-[11px] text-wall-muted">{isMember ? "Member" : "Guest"}</span>
          )}
        </p>
        <p className="mt-0.5 whitespace-pre-wrap break-words">{post.message}</p>
        <p className="mt-1 text-[11px] text-wall-muted">
          <TimeAgo iso={post.created_at} />
        </p>
      </div>
    </li>
  );
}

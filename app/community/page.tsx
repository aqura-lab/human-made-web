import { requireUser, isAdmin } from "@/lib/auth/guards";
import { getPublicIdeas } from "@/lib/community/board";
import { AuthedHeader } from "@/components/dashboard/AuthedHeader";
import { SiteFooter } from "@/components/Chrome";
import { IdeaBoard } from "@/components/community/IdeaBoard";

export const metadata = { title: "Community — Human Made" };

export default async function CommunityPage() {
  const user = await requireUser();
  const ideas = await getPublicIdeas(user.id);
  return (
    <>
      <AuthedHeader isAdmin={isAdmin(user)} />
      <main className="wrap" style={{ paddingTop: 40 }}>
        <p className="kicker">Community</p>
        <h1 style={{ marginBottom: 6 }}>Help shape what we build</h1>
        <p className="muted small" style={{ marginBottom: 18 }}>
          Upvote the ideas you want most. Votes help us prioritise — this is a ranking of ideas, not people.
        </p>
        <IdeaBoard initial={ideas} />
      </main>
      <SiteFooter />
    </>
  );
}

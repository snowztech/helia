"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  ArrowLeft02Icon,
  Delete02Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import {
  api,
  type ConversationDetail,
  type ConversationTurn,
} from "@/lib/api";
import { renderMarkdown } from "@/lib/markdown";
import { BanUserDialog } from "../_components/ban-user-dialog";

export default function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getConversation(id)
      .then((r) => setData(r.conversation))
      .catch((err: Error) => toast.error(err.message ?? "load failed"))
      .finally(() => setLoading(false));
  }, [id]);

  const deleteConversation = async () => {
    try {
      await api.deleteConversation(id);
      toast.success("Conversation deleted");
      router.replace("/conversations");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "delete failed");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-sm text-muted-foreground">
          Conversation not found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink />

      <header className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <code>{data.id.slice(0, 8)}</code>
            <span>·</span>
            <span>{new Date(data.lastActiveAt).toLocaleString()}</span>
            {data.userName && (
              <>
                <span>·</span>
                <span className="text-foreground">{data.userName}</span>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{data.model}</Badge>
            <Badge variant="outline">
              {data.totalTokens.toLocaleString()} tokens
            </Badge>
            <Badge variant="outline">
              {data.turns.length}{" "}
              {data.turns.length === 1 ? "turn" : "turns"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {data.userId && (
            <BanUserDialog userId={data.userId} userName={data.userName} />
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" aria-label="Delete conversation">
                <HugeiconsIcon icon={Delete02Icon} size={14} />
                delete
              </Button>
            </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
              <AlertDialogDescription>
                Removes all {data.turns.length} turn
                {data.turns.length === 1 ? "" : "s"}. Cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  void deleteConversation();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <div className="space-y-4">
        {data.turns.map((turn) => (
          <Turn key={turn.id} turn={turn} />
        ))}
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/conversations"
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
    >
      <HugeiconsIcon icon={ArrowLeft02Icon} size={12} />
      conversations
    </Link>
  );
}

/**
 * One turn = the user's message + the agent's reply, plus any retrieval
 * and tool calls that fired in between. Bubbles match the widget preview
 * style so the admin sees what the end-user saw.
 */
function Turn({ turn }: { turn: ConversationTurn }) {
  const toolCalls = collectToolCalls(turn);

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          <p className="whitespace-pre-wrap">{turn.userMessage}</p>
        </div>
      </div>

      <div className="flex justify-start">
        <div className="max-w-[80%] space-y-2">
          {turn.error ? (
            <div className="flex items-start gap-2 rounded-2xl rounded-bl-md bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              <HugeiconsIcon icon={Alert02Icon} size={14} className="mt-0.5" />
              <span className="whitespace-pre-wrap">{turn.error}</span>
            </div>
          ) : turn.finalAnswer ? (
            <div
              className="preview-md rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-sm"
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(turn.finalAnswer),
              }}
            />
          ) : (
            <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-sm text-muted-foreground">
              No answer recorded.
            </div>
          )}

          {(turn.retrieval.length > 0 || toolCalls.length > 0) && (
            <details className="rounded-md border border-border-subtle bg-muted/30 px-3 py-1.5 text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                {[
                  turn.retrieval.length > 0
                    ? `${turn.retrieval.length} source${turn.retrieval.length === 1 ? "" : "s"}`
                    : null,
                  toolCalls.length > 0
                    ? `${toolCalls.length} tool call${toolCalls.length === 1 ? "" : "s"}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </summary>

              {turn.retrieval.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Retrieval
                  </p>
                  <ul className="space-y-1">
                    {turn.retrieval.map((r, i) => (
                      <li
                        key={`${r.title}-${i}`}
                        className="flex items-center gap-2"
                      >
                        <code className="w-10 text-[10px] text-muted-foreground">
                          {r.score.toFixed(3)}
                        </code>
                        <span className="min-w-0 flex-1 truncate">
                          {r.url ? (
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              className="underline underline-offset-2 hover:no-underline"
                            >
                              {r.title}
                            </a>
                          ) : (
                            r.title
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {toolCalls.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Tool calls
                  </p>
                  <ul className="space-y-2">
                    {toolCalls.map((call, i) => (
                      <li key={i} className="space-y-1">
                        <code className="text-foreground">{call.toolName}</code>
                        {call.args !== undefined && (
                          <JsonBlock label="args" value={call.args} />
                        )}
                        {call.result !== undefined && (
                          <JsonBlock label="result" value={call.result} />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </details>
          )}

          <div className="flex items-center gap-2 px-1 text-[10px] text-muted-foreground">
            <HugeiconsIcon icon={SparklesIcon} size={10} />
            <span>{turn.totalTokens.toLocaleString()} tokens</span>
            <span>·</span>
            <span>{turn.totalLatencyMs}ms</span>
            <span>·</span>
            <span>{new Date(turn.createdAt).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function collectToolCalls(turn: ConversationTurn) {
  return turn.steps.flatMap((s) => {
    if (!s.toolCalls?.length) return [];
    return s.toolCalls.map((call) => {
      const matchingResult = s.toolResults?.find(
        (tr) => tr.toolCallId === call.toolCallId,
      );
      return {
        toolName: call.toolName ?? "tool",
        args: call.args,
        result: matchingResult?.result,
      };
    });
  });
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  let json: string;
  try {
    json = JSON.stringify(value, null, 2);
  } catch {
    json = String(value);
  }
  const long = json.length > 400;
  return (
    <details open={!long} className="text-[11px]">
      <summary className="cursor-pointer text-muted-foreground">{label}</summary>
      <pre className="mt-1 overflow-auto rounded-md border border-border bg-zinc-950 p-2 leading-relaxed text-zinc-100">
        <code>{json}</code>
      </pre>
    </details>
  );
}

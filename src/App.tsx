// App.tsx
import React, { useEffect, useRef, useState } from "react";
import Talk from "talkjs";

const TALKJS_APP_ID = (import.meta.env.VITE_TALKJS_APP_ID as string) || ""; // .env의 VITE_TALKJS_APP_ID 사용

type SimpleUser = {
    id: string;
    name: string;
    email: string;
    photoUrl: string;
    role: "keeper" | "creator";
};

function resolveUsers(): { me: SimpleUser; other: SimpleUser; label: string } {
    const params = new URLSearchParams(window.location.search);
    const who = params.get("user") || "user1"; // 기본: user1

    const keeper: SimpleUser = {
        id: "user1",
        name: "User 1 (Keeper)",
        email: "user1@example.com",
        photoUrl: "https://talkjs.com/images/avatar-1.jpg",
        role: "keeper"
    };

    const creator: SimpleUser = {
        id: "user2",
        name: "User 2 (Creator)",
        email: "user2@example.com",
        photoUrl: "https://talkjs.com/images/avatar-2.jpg",
        role: "creator"
    };

    if (who === "user2") {
        return {
            me: creator,
            other: keeper,
            label: "User2 – Creator (상담방 입장)"
        };
    } else {
        return {
            me: keeper,
            other: creator,
            label: "User1 – Keeper (상담방 생성)"
        };
    }
}

const App: React.FC = () => {
    const { me, other, label } = resolveUsers();

    const [talkReady, setTalkReady] = useState(false);
    const sessionRef = useRef<Talk.Session | null>(null);
    const meRef = useRef<Talk.User | null>(null);
    const otherRef = useRef<Talk.User | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        let isCancelled = false;

        Talk.ready.then(() => {
            if (isCancelled) {
                return;
            }

            if (!TALKJS_APP_ID) {
                console.error("환경 변수 VITE_TALKJS_APP_ID가 설정되지 않았습니다. .env에 VITE_TALKJS_APP_ID=<YOUR_TALKJS_APP_ID>를 추가하세요.");
                return;
            }

            const meUser = new Talk.User(me);
            const otherUser = new Talk.User(other);

            const session = new Talk.Session({
                appId: TALKJS_APP_ID,
                me: meUser
            });

            sessionRef.current = session;
            meRef.current = meUser;
            otherRef.current = otherUser;
            setTalkReady(true);
        });

        return () => {
            isCancelled = true;
            if (sessionRef.current) {
                sessionRef.current.destroy();
                sessionRef.current = null;
            }
        };
    }, [me.id, other.id]);

    const handleOpenChat = () => {
        if (!talkReady || !sessionRef.current || !meRef.current || !otherRef.current || !containerRef.current) {
            alert("채팅 초기화 중입니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        const session = sessionRef.current;
        const meUser = meRef.current;
        const otherUser = otherRef.current;

        const conversationId = Talk.oneOnOneId(meUser, otherUser);
        const conversation = session.getOrCreateConversation(conversationId);

        conversation.setParticipant(meUser);
        conversation.setParticipant(otherUser);

        // 🔥 최신 방식
        const chatbox = session.createChatbox();   
        chatbox.select(conversation);              
        chatbox.mount(containerRef.current);
    };

    const isKeeper = me.role === "keeper";

    return (
        <div
            style={{
                fontFamily: "sans-serif",
                padding: 16
            }}
        >
            <h2>{label}</h2>
            <p>
                이 창은 <strong>{me.id}</strong> 용입니다.
                <br />
                {isKeeper
                    ? "아래 버튼을 누르면 user2와의 1:1 상담방이 생성됩니다."
                    : "아래 버튼을 누르면 user1과의 1:1 상담방에 입장합니다."}
            </p>

            <button
                onClick={handleOpenChat}
                style={{ padding: "8px 16px", fontSize: 14 }}
            >
                {isKeeper ? "상담방 생성" : "상담방 입장"}
            </button>

            <div
                ref={containerRef}
                style={{
                    marginTop: 16,
                    width: "100%",
                    height: 600,
                    border: "1px solid #ddd",
                    borderRadius: 8
                }}
            />
        </div>
    );
};

export default App;

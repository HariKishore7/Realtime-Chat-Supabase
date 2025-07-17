import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";

function App() {
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [usersOnline, setUsersOnline] = useState([]);

  const chatContainerRef = useRef(null);
  const scroll = useRef();

  const roomRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // sign in
  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  // sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
  };

  useEffect(() => {
    if (!session?.user || roomRef.current) {
      setUsersOnline([]);
      setMessages([]); // clear messages on sign out
      return;
    }
    // Unsubscribe previous channel if any
    if (roomRef.current) {
      roomRef.current.unsubscribe();
      roomRef.current = null;
    }

    const roomOne = supabase.channel("room_one", {
      config: {
        presence: {
          key: session.user.id,
        },
      },
    });

    roomRef.current = roomOne;

    roomOne
      .on("broadcast", { event: "message" }, (payload) => {
        setMessages((prevMessages) => [...prevMessages, payload.payload]);
      })
      .on("presence", { event: "sync" }, () => {
        const state = roomOne.presenceState();
        setUsersOnline(Object.keys(state));
      });

    // Subscribe and track
    roomOne.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await roomOne.track({
          id: session.user.id,
        });
      }
    });

    return () => {
      roomOne.unsubscribe();
      roomRef.current = null;
    };

  }, [session]);

  // send message
  const sendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    const payload = {
      message: newMessage,
      user_name: session?.user?.email, // use consistent field
      avatar: session?.user?.user_metadata?.avatar_url,
      timestamp: new Date().toISOString(),
    };

    const result = await roomRef.current?.send({
      type: "broadcast",
      event: "message",
      payload,
    });

    setMessages((prev) => [...prev, payload]);
    setNewMessage("");
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString("en-us", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (!session) {
    return (
      <div className="w-full flex h-screen justify-center items-center">
        <button onClick={signIn}>Sign in with Google to chat</button>
      </div>
    );
  } else {
    return (
      <div className="w-full flex h-screen justify-center items-center p-4">
        <div className="border-[1px] border-gray-700 max-w-6xl w-full min-h-[600px] rounded-lg" >
          {/* Header */}
          <div className="flex justify-between h-20 border-b-[1px] border-gray-700">
            <div className="p-4">
              <p className="text-gray-300">
                Signed in as {session?.user?.user_metadata?.email}
              </p>
              <p className="text-gray-300 italic text-sm">
                {usersOnline.length} users online
              </p>
            </div>
            <button onClick={signOut} className="m-2 sm:mr-4">
              Sign out
            </button>
          </div>
          {/* main chat */}
          <div
            ref={chatContainerRef}
            className="p-4 flex flex-col overflow-y-auto h-[500px]"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`my-2 flex w-full items-start ${msg?.user_name === session.user.user_metadata.email
                  ? "justify-end"
                  : "justify-start"
                  }`}
              >
                {/* received message - avatar on left */}
                {msg?.user_name !== session.user.user_metadata.email && (
                  <img
                    src={msg?.avatar}
                    alt="/"
                    className="w-10 h-10 rounded-full mr-2"
                  />
                )}

                <div className="flex flex-col w-full">
                  <div
                    className={`p-1 max-w-[70%] rounded-xl ${msg?.user_name === session.user.user_metadata.email
                      ? "bg-gray-700 text-white ml-auto"
                      : "bg-gray-500 text-white mr-auto"
                      }`}
                  >
                    <p>{msg.message}</p>
                  </div>
                  {/* timestamp */}
                  <div
                    className={`text-xs opactiy-75 pt-1 ${msg?.user_name === session.user.user_metadata.email
                      ? "text-right mr-2"
                      : "text-left ml-2"
                      }`}
                  >
                    {formatTime(msg?.timestamp)}
                  </div>
                </div>

                {msg?.user_name === session.user.user_metadata.email && (
                  <img
                    src={msg?.avatar}
                    alt="/"
                    className="w-10 h-10 rounded-full ml-2"
                  />
                )}
              </div>
            ))}
          </div>
          {/* message input */}
          <form
            onSubmit={sendMessage}
            className="flex flex-col sm:flex-row p-4 border-t-[1px] border-gray-700"
          >
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              type="text"
              placeholder="Type a message..."
              className="p-2 w-full bg-[#00000040] rounded-lg"
            />
            <button className="mt-4 sm:mt-0 sm:ml-8 text-white max-h-12">
              Send
            </button>
            <span ref={scroll}></span>
          </form>
        </div>
      </div>
    );
  }
}

export default App;
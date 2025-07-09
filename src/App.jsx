import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { supabase } from '../supabaseClient';

function App() {
  const [instruments, setInstruments] = useState([]);
  const [session, setSession] = useState([]);

  useEffect(() => {
    getInstruments();
  }, []);
  async function getInstruments() {
    const { data } = await supabase.from("instruments").select();
    setInstruments(data);
  }
  console.log('instruments', instruments);
  console.log('session', session);


  //signin
  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  }

  //signout
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
  }

  if (session) {
    return (
      <div className='w-full h-screen flex justify-center items-center'>
        <button className='p-4 bg-blue-500 text-white rounded-lg' onClick={signIn}>Sign In with Google</button>
      </div>
    )
  }

  return (
    <div className='w-full h-screen flex  justify-center items-center p-4'>
      <div className='border-[1px] border-gray-700 max-w-6xl w-full min-h-[600px] '>
        {/* Header */}
        <div className='flex justify-between h-20 border-b-[1px] border-gray-700'>
          <div className='p-4'>
            <p className='text-gray-300'>Signed in as ....</p>
            <p className='text-gray-300 italic text-sm'>3 users online</p>
          </div>
          <button className='m-2 sm:mr-4' onClick={signOut}>Sign Out</button>
        </div>
        {/* Main chat */}
        <div></div>
        {/* Message input */}
        <form className='flex flex-col sm:flex-row p-4 border-t-[1px] border-gray-700'>
          <input type="text" name="input" id="" placeholder='Type a message' className='p-2 w-full bg-[#000000] rounded-lg text-white' />
          <button className='mt-4 sm:mt-0 sm:ml-8 text-white max-h-12' onClick={signOut}>Send</button>
        </form>
      </div>
    </div>
  )
}

export default App

import React, { useContext, useEffect, useState } from 'react';
import dp from "../assets/dp.webp";
import moment from "moment";
import { FaRegCommentDots } from "react-icons/fa";
import { BiLike, BiSolidLike } from "react-icons/bi";
import { LuSendHorizontal } from "react-icons/lu";
import axios from 'axios';
import { authDataContext } from '../context/AuthContext';
import { userDataContext } from '../context/UserContext';
import { io } from "socket.io-client";
import ConnectionButton from './ConnectionButton';

let socket;

function Post({ id, author, like, comment, description, image, createdAt }) {
  const [more, setMore] = useState(false);
  const { serverUrl } = useContext(authDataContext);
  const { userData } = useContext(userDataContext);
  const [likes, setLikes] = useState(like || []);
  const [commentContent, setCommentContent] = useState("");
  const [comments, setComments] = useState(comment || []);
  const [showComment, setShowComment] = useState(false);

  // Init socket only once
  useEffect(() => {
    if (!socket) {
      socket = io(serverUrl, { transports: ["websocket"] });
    }
    socket.on("likeUpdated", ({ postId, likes }) => {
      if (postId === id) setLikes(likes);
    });
    socket.on("commentAdded", ({ postId, comm }) => {
      if (postId === id) setComments(comm);
    });
    return () => {
      socket.off("likeUpdated");
      socket.off("commentAdded");
    };
  }, [id, serverUrl]);

  const handleLike = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/post/like/${id}`, { withCredentials: true });
      setLikes(result.data.like);
    } catch (error) {
      console.error("Like error:", error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    try {
      const result = await axios.post(`${serverUrl}/api/post/comment/${id}`, {
        content: commentContent.trim()
      }, { withCredentials: true });
      setComments(result.data.comment);
      setCommentContent("");
    } catch (error) {
      console.error("Comment error:", error);
    }
  };

  return (
    <div className="w-full min-h-[200px] flex flex-col gap-4 bg-white rounded-xl shadow-md p-5 transition-all hover:shadow-lg">
      
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div
          className='flex gap-3 items-start cursor-pointer'
          onClick={() => window.location.href = `/profile/${author.userName}`}
        >
          <div className='w-[60px] h-[60px] rounded-full overflow-hidden flex items-center justify-center border border-gray-200 shadow-sm'>
            <img src={author.profileImage || dp} alt="" className='h-full w-full object-cover' />
          </div>
          <div>
            <div className='text-lg font-semibold hover:text-[#0077b5] transition-colors'>
              {`${author.firstName} ${author.lastName}`}
            </div>
            <div className='text-sm text-gray-600'>{author.headline}</div>
            <div className='text-xs text-gray-500'>{moment(createdAt).fromNow()}</div>
          </div>
        </div>

        {userData._id !== author._id && <ConnectionButton userId={author._id} />}
      </div>

      {/* Post description */}
      <div className={`w-full ${!more ? "max-h-[100px] overflow-hidden" : ""} pl-[60px] text-gray-800`}>
        {description}
      </div>
      {description.length > 120 && (
        <div
          className="pl-[60px] text-sm font-medium text-[#0077b5] cursor-pointer hover:underline"
          onClick={() => setMore(prev => !prev)}
        >
          {more ? "Read less..." : "Read more..."}
        </div>
      )}

      {/* Image */}
      {image && (
        <div className='w-full h-[300px] overflow-hidden flex justify-center rounded-lg'>
          <img src={image} alt="" className='h-full object-cover hover:scale-[1.02] transition-transform duration-300' />
        </div>
      )}

      {/* Likes & comments count */}
      <div className='flex justify-between items-center px-4 py-2 border-t border-b border-gray-200'>
        <div className='flex items-center gap-2 text-gray-600 text-sm'>
          <BiLike className='text-[#1ebbff] w-4 h-4' /><span>{likes.length}</span>
        </div>
        <div
          className='flex items-center gap-2 text-gray-600 text-sm cursor-pointer hover:text-[#0077b5]'
          onClick={() => setShowComment(prev => !prev)}
        >
          <span>{comments.length}</span>
          <span>Comments</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className='flex justify-around items-center text-gray-700 font-medium py-2'>
        {!likes.includes(userData._id) ? (
          <div
            className='flex items-center gap-2 cursor-pointer hover:text-[#0077b5]'
            onClick={handleLike}
          >
            <BiLike className='w-5 h-5' /><span>Like</span>
          </div>
        ) : (
          <div
            className='flex items-center gap-2 cursor-pointer text-[#07a4ff]'
            onClick={handleLike}
          >
            <BiSolidLike className='w-5 h-5' /><span className="font-semibold">Liked</span>
          </div>
        )}

        <div
          className='flex items-center gap-2 cursor-pointer hover:text-[#0077b5]'
          onClick={() => setShowComment(prev => !prev)}
        >
          <FaRegCommentDots className='w-5 h-5' /><span>Comment</span>
        </div>
      </div>

      {/* Comments section */}
      {showComment && (
        <div className='mt-2'>
          <form
            className="flex justify-between items-center border border-gray-200 rounded-full px-4 py-1"
            onSubmit={handleComment}
          >
            <input
              type="text"
              placeholder="Leave a comment..."
              className='flex-1 outline-none border-none text-sm'
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
            />
            <button type="submit">
              <LuSendHorizontal className="text-[#07a4ff] w-5 h-5" />
            </button>
          </form>

          {/* Comment list */}
          <div className='mt-3 flex flex-col gap-3'>
            {comments.map((com) => (
              <div key={com._id} className='flex flex-col gap-1 border-b border-gray-200 pb-2'>
                <div className="flex items-center gap-2">
                  <div className='w-[35px] h-[35px] rounded-full overflow-hidden'>
                    <img src={com.user.profileImage || dp} alt="" className='h-full w-full object-cover' />
                  </div>
                  <div className='text-sm font-semibold'>{`${com.user.firstName} ${com.user.lastName}`}</div>
                </div>
                <div className='pl-[45px] text-sm text-gray-700'>{com.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default Post;

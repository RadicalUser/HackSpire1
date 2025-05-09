import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
}

export const Input: React.FC<InputProps> = ({ id, ...props }) => {
  return (
    <div className="outline outline-1 outline-gray-300 rounded-md focus-within:outline-blue-500">
      <input
        id={id}
        className="border-none outline-none bg-transparent px-3 py-2 w-full focus:ring-0"
        {...props}
      />
    </div>
  );
};

export default Input;
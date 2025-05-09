import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return <div className={`bg-black shadow rounded p-4 ${className}`}>{children}</div>;
};

export const CardHeader: React.FC<CardProps> = ({ children, className }) => {
  return <div className={`border-b pb-2 mb-4 ${className}`}>{children}</div>;
};

export const CardTitle: React.FC<CardProps> = ({ children, className }) => {
  return <h2 className={`text-lg font-bold ${className}`}>{children}</h2>;


};

export const CardContent: React.FC<CardProps> = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

export default Card;
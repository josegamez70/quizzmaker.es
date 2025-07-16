import type { Question } from "./types.ts";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
        };
        Insert: {
          id: string;
          username:string;
        };
        Update: {
          id?: string;
          username?: string;
        };
      };
      quizzes: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          score: number;
          total_questions: number;
          questions_data: Json;
          user_answers_data: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          score: number;
          total_questions: number;
          questions_data: Json;
          user_answers_data: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          score?: number;
          total_questions?: number;
          questions_data?: Json;
          user_answers_data?: Json;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
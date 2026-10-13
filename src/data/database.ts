// Shape of the database as seen through the API, matching supabase/migrations.
// Regenerate with `pnpm db:types` after changing a migration; CI compares the
// committed file with the generated one.

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          owner_id: string;
          display_name: string;
          weight_unit: "kg" | "lb";
          theme: "system" | "light" | "dark";
          week_starts_on: number;
          time_zone: string;
          default_rest_seconds: number;
          load_increment_kg: number;
          training_goal: "hypertrophy" | "strength" | "general_fitness" | null;
          experience_level: "beginner" | "intermediate" | "advanced" | null;
          onboarding_step: number;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: Partial<
          Omit<
            Database["public"]["Tables"]["profiles"]["Row"],
            "owner_id" | "created_at" | "updated_at"
          >
        >;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      consume_rate_limit: {
        Args: { bucket: string; max_hits: number; window_seconds: number };
        Returns: boolean;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

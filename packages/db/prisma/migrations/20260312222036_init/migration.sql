-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "loavish";

-- CreateTable
CREATE TABLE "retailers" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "loyalty_scheme" TEXT NOT NULL DEFAULT 'none',
    "country_code" TEXT NOT NULL DEFAULT 'GB',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retailers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingestion_runs" (
    "id" UUID NOT NULL,
    "retailer_id" UUID NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "products_scraped" INTEGER NOT NULL DEFAULT 0,
    "errors_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingestion_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retailer_context" (
    "id" UUID NOT NULL,
    "retailer_id" UUID NOT NULL,
    "context_key" TEXT NOT NULL,
    "context_json" JSONB NOT NULL,
    "postcode" TEXT,
    "store_id" TEXT,
    "loyalty_enabled" BOOLEAN NOT NULL DEFAULT false,
    "source_snapshot_url" TEXT,
    "source_payload_sha256" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retailer_context_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retailer_products" (
    "id" UUID NOT NULL,
    "retailer_id" UUID NOT NULL,
    "retailer_product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "category" TEXT,
    "pack_size_raw" TEXT,
    "normalized_quantity" DOUBLE PRECISION,
    "normalized_unit" TEXT,
    "image_url" TEXT,
    "product_url" TEXT NOT NULL,
    "source_payload_sha256" TEXT,
    "scraped_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retailer_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retailer_prices" (
    "id" UUID NOT NULL,
    "retailer_id" UUID NOT NULL,
    "retailer_product_id" UUID NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "base_price_pence" INTEGER NOT NULL,
    "promo_price_pence" INTEGER,
    "loyalty_price_pence" INTEGER,
    "loyalty_scheme" TEXT,
    "promo_label" TEXT,
    "valid_from" TIMESTAMP(3),
    "valid_to" TIMESTAMP(3),
    "observed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_snapshot_url" TEXT,
    "source_payload_sha256" TEXT,

    CONSTRAINT "retailer_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canonical_ingredients" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "default_unit" TEXT NOT NULL,
    "waste_half_life_days" INTEGER NOT NULL,
    "perishability_tier" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canonical_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canonical_products" (
    "id" UUID NOT NULL,
    "canonical_ingredient_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "form" TEXT,
    "quality_tier" TEXT,
    "pack_size_raw" TEXT,
    "normalized_quantity" DOUBLE PRECISION,
    "normalized_unit" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canonical_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_matches" (
    "id" UUID NOT NULL,
    "retailer_product_id" UUID NOT NULL,
    "canonical_product_id" UUID,
    "canonical_ingredient_id" UUID,
    "match_label" TEXT NOT NULL,
    "match_score" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "matched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "normalized_prices" (
    "id" UUID NOT NULL,
    "retailer_id" UUID NOT NULL,
    "retailer_product_id" UUID NOT NULL,
    "retailer_price_id" UUID,
    "canonical_product_id" UUID,
    "canonical_ingredient_id" UUID,
    "effective_price_pence" INTEGER NOT NULL,
    "unit_price_pence_100" INTEGER NOT NULL,
    "quantity_base_unit" DOUBLE PRECISION NOT NULL,
    "base_unit" TEXT NOT NULL,
    "match_label" TEXT NOT NULL,
    "freshness_status" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "normalized_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_price_snapshots" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "week_start_date" TIMESTAMP(3),
    "retailer_id" UUID NOT NULL,
    "canonical_ingredient_id" UUID NOT NULL,
    "retailer_product_id" UUID,
    "normalized_price_id" UUID,
    "price_pence" INTEGER NOT NULL,
    "match_label" TEXT NOT NULL,
    "freshness_status" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "snapped_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingredient_price_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meals" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "meal_type" TEXT NOT NULL,
    "prep_time_minutes" INTEGER NOT NULL,
    "instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_ingredients" (
    "id" UUID NOT NULL,
    "meal_id" UUID NOT NULL,
    "canonical_ingredient_id" UUID NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "optional" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_cost_snapshots" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "week_start_date" TIMESTAMP(3),
    "meal_id" UUID NOT NULL,
    "retailer_id" UUID NOT NULL,
    "loyalty_enabled" BOOLEAN NOT NULL DEFAULT false,
    "total_cost_pence" INTEGER NOT NULL,
    "waste_penalty_pence" INTEGER NOT NULL DEFAULT 0,
    "per_ingredient_costs_json" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_cost_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "substitution_rules" (
    "id" UUID NOT NULL,
    "source_ingredient_id" UUID NOT NULL,
    "substitute_ingredient_id" UUID NOT NULL,
    "quality_tier" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "substitution_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_retailer_preferences" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "retailer_id" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "loyalty_enabled" BOOLEAN NOT NULL DEFAULT false,
    "postcode" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_retailer_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_alerts" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "canonical_ingredient_id" UUID NOT NULL,
    "retailer_id" UUID,
    "threshold_price_pence" INTEGER NOT NULL,
    "last_notified_price_pence" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "triggered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_log" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "meal_id" UUID,
    "recommendation_type" TEXT NOT NULL,
    "recommendation_json" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "accepted" BOOLEAN,
    "points_awarded" INTEGER,
    "guardrail_triggered" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "decision_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_ledger" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "decision_log_id" UUID,
    "event_type" TEXT NOT NULL,
    "points_awarded" INTEGER NOT NULL,
    "explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "retailers_slug_key" ON "retailers"("slug");

-- CreateIndex
CREATE INDEX "ingestion_runs_retailer_id_started_at_idx" ON "ingestion_runs"("retailer_id", "started_at");

-- CreateIndex
CREATE INDEX "retailer_context_retailer_id_updated_at_idx" ON "retailer_context"("retailer_id", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "retailer_context_retailer_id_context_key_key" ON "retailer_context"("retailer_id", "context_key");

-- CreateIndex
CREATE INDEX "retailer_products_retailer_id_category_idx" ON "retailer_products"("retailer_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "retailer_products_retailer_id_retailer_product_id_key" ON "retailer_products"("retailer_id", "retailer_product_id");

-- CreateIndex
CREATE INDEX "retailer_prices_retailer_id_observed_at_idx" ON "retailer_prices"("retailer_id", "observed_at");

-- CreateIndex
CREATE INDEX "retailer_prices_retailer_product_id_observed_at_idx" ON "retailer_prices"("retailer_product_id", "observed_at");

-- CreateIndex
CREATE UNIQUE INDEX "canonical_ingredients_slug_key" ON "canonical_ingredients"("slug");

-- CreateIndex
CREATE INDEX "canonical_ingredients_category_name_idx" ON "canonical_ingredients"("category", "name");

-- CreateIndex
CREATE INDEX "canonical_products_canonical_ingredient_id_quality_tier_idx" ON "canonical_products"("canonical_ingredient_id", "quality_tier");

-- CreateIndex
CREATE INDEX "product_matches_status_match_score_idx" ON "product_matches"("status", "match_score");

-- CreateIndex
CREATE INDEX "product_matches_retailer_product_id_matched_at_idx" ON "product_matches"("retailer_product_id", "matched_at");

-- CreateIndex
CREATE INDEX "normalized_prices_canonical_ingredient_id_retailer_id_compu_idx" ON "normalized_prices"("canonical_ingredient_id", "retailer_id", "computed_at");

-- CreateIndex
CREATE INDEX "normalized_prices_retailer_id_freshness_status_idx" ON "normalized_prices"("retailer_id", "freshness_status");

-- CreateIndex
CREATE INDEX "ingredient_price_snapshots_user_id_snapped_at_idx" ON "ingredient_price_snapshots"("user_id", "snapped_at");

-- CreateIndex
CREATE INDEX "ingredient_price_snapshots_canonical_ingredient_id_retailer_idx" ON "ingredient_price_snapshots"("canonical_ingredient_id", "retailer_id", "snapped_at");

-- CreateIndex
CREATE UNIQUE INDEX "meals_slug_key" ON "meals"("slug");

-- CreateIndex
CREATE INDEX "meals_meal_type_name_idx" ON "meals"("meal_type", "name");

-- CreateIndex
CREATE INDEX "meal_ingredients_meal_id_idx" ON "meal_ingredients"("meal_id");

-- CreateIndex
CREATE INDEX "meal_ingredients_canonical_ingredient_id_idx" ON "meal_ingredients"("canonical_ingredient_id");

-- CreateIndex
CREATE INDEX "meal_cost_snapshots_user_id_created_at_idx" ON "meal_cost_snapshots"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "meal_cost_snapshots_meal_id_retailer_id_calculated_at_idx" ON "meal_cost_snapshots"("meal_id", "retailer_id", "calculated_at");

-- CreateIndex
CREATE INDEX "substitution_rules_source_ingredient_id_is_active_idx" ON "substitution_rules"("source_ingredient_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "substitution_rules_source_ingredient_id_substitute_ingredie_key" ON "substitution_rules"("source_ingredient_id", "substitute_ingredient_id");

-- CreateIndex
CREATE INDEX "user_retailer_preferences_user_id_enabled_idx" ON "user_retailer_preferences"("user_id", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "user_retailer_preferences_user_id_retailer_id_key" ON "user_retailer_preferences"("user_id", "retailer_id");

-- CreateIndex
CREATE INDEX "price_alerts_user_id_is_active_created_at_idx" ON "price_alerts"("user_id", "is_active", "created_at");

-- CreateIndex
CREATE INDEX "price_alerts_canonical_ingredient_id_retailer_id_idx" ON "price_alerts"("canonical_ingredient_id", "retailer_id");

-- CreateIndex
CREATE INDEX "decision_log_user_id_created_at_idx" ON "decision_log"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "decision_log_accepted_created_at_idx" ON "decision_log"("accepted", "created_at");

-- CreateIndex
CREATE INDEX "points_ledger_user_id_created_at_idx" ON "points_ledger"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "points_ledger_event_type_created_at_idx" ON "points_ledger"("event_type", "created_at");

-- AddForeignKey
ALTER TABLE "ingestion_runs" ADD CONSTRAINT "ingestion_runs_retailer_id_fkey" FOREIGN KEY ("retailer_id") REFERENCES "retailers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retailer_context" ADD CONSTRAINT "retailer_context_retailer_id_fkey" FOREIGN KEY ("retailer_id") REFERENCES "retailers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retailer_products" ADD CONSTRAINT "retailer_products_retailer_id_fkey" FOREIGN KEY ("retailer_id") REFERENCES "retailers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retailer_prices" ADD CONSTRAINT "retailer_prices_retailer_id_fkey" FOREIGN KEY ("retailer_id") REFERENCES "retailers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retailer_prices" ADD CONSTRAINT "retailer_prices_retailer_product_id_fkey" FOREIGN KEY ("retailer_product_id") REFERENCES "retailer_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canonical_products" ADD CONSTRAINT "canonical_products_canonical_ingredient_id_fkey" FOREIGN KEY ("canonical_ingredient_id") REFERENCES "canonical_ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_matches" ADD CONSTRAINT "product_matches_retailer_product_id_fkey" FOREIGN KEY ("retailer_product_id") REFERENCES "retailer_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_matches" ADD CONSTRAINT "product_matches_canonical_product_id_fkey" FOREIGN KEY ("canonical_product_id") REFERENCES "canonical_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_matches" ADD CONSTRAINT "product_matches_canonical_ingredient_id_fkey" FOREIGN KEY ("canonical_ingredient_id") REFERENCES "canonical_ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "normalized_prices" ADD CONSTRAINT "normalized_prices_retailer_id_fkey" FOREIGN KEY ("retailer_id") REFERENCES "retailers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "normalized_prices" ADD CONSTRAINT "normalized_prices_retailer_product_id_fkey" FOREIGN KEY ("retailer_product_id") REFERENCES "retailer_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "normalized_prices" ADD CONSTRAINT "normalized_prices_retailer_price_id_fkey" FOREIGN KEY ("retailer_price_id") REFERENCES "retailer_prices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "normalized_prices" ADD CONSTRAINT "normalized_prices_canonical_product_id_fkey" FOREIGN KEY ("canonical_product_id") REFERENCES "canonical_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "normalized_prices" ADD CONSTRAINT "normalized_prices_canonical_ingredient_id_fkey" FOREIGN KEY ("canonical_ingredient_id") REFERENCES "canonical_ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_price_snapshots" ADD CONSTRAINT "ingredient_price_snapshots_retailer_id_fkey" FOREIGN KEY ("retailer_id") REFERENCES "retailers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_price_snapshots" ADD CONSTRAINT "ingredient_price_snapshots_canonical_ingredient_id_fkey" FOREIGN KEY ("canonical_ingredient_id") REFERENCES "canonical_ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_price_snapshots" ADD CONSTRAINT "ingredient_price_snapshots_retailer_product_id_fkey" FOREIGN KEY ("retailer_product_id") REFERENCES "retailer_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_price_snapshots" ADD CONSTRAINT "ingredient_price_snapshots_normalized_price_id_fkey" FOREIGN KEY ("normalized_price_id") REFERENCES "normalized_prices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_ingredients" ADD CONSTRAINT "meal_ingredients_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_ingredients" ADD CONSTRAINT "meal_ingredients_canonical_ingredient_id_fkey" FOREIGN KEY ("canonical_ingredient_id") REFERENCES "canonical_ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_cost_snapshots" ADD CONSTRAINT "meal_cost_snapshots_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_cost_snapshots" ADD CONSTRAINT "meal_cost_snapshots_retailer_id_fkey" FOREIGN KEY ("retailer_id") REFERENCES "retailers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "substitution_rules" ADD CONSTRAINT "substitution_rules_source_ingredient_id_fkey" FOREIGN KEY ("source_ingredient_id") REFERENCES "canonical_ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "substitution_rules" ADD CONSTRAINT "substitution_rules_substitute_ingredient_id_fkey" FOREIGN KEY ("substitute_ingredient_id") REFERENCES "canonical_ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_retailer_preferences" ADD CONSTRAINT "user_retailer_preferences_retailer_id_fkey" FOREIGN KEY ("retailer_id") REFERENCES "retailers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_canonical_ingredient_id_fkey" FOREIGN KEY ("canonical_ingredient_id") REFERENCES "canonical_ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_retailer_id_fkey" FOREIGN KEY ("retailer_id") REFERENCES "retailers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_log" ADD CONSTRAINT "decision_log_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_decision_log_id_fkey" FOREIGN KEY ("decision_log_id") REFERENCES "decision_log"("id") ON DELETE SET NULL ON UPDATE CASCADE;

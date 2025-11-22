--
-- PostgreSQL database dump
--

\restrict 2y2cbFnvAWF6B9BI1QB5KiJ5avmDEBqmAtz2aIY5wV020xe6yY8eb9S8w5A69XD

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: hdb_catalog; Type: SCHEMA; Schema: -; Owner: wms_user
--

CREATE SCHEMA hdb_catalog;


ALTER SCHEMA hdb_catalog OWNER TO wms_user;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: ChannelType; Type: TYPE; Schema: public; Owner: wms_user
--

CREATE TYPE public."ChannelType" AS ENUM (
    'AMAZON_FBA',
    'SHOPIFY',
    'EBAY',
    'DIRECT',
    'WHOLESALE',
    'CUSTOM'
);


ALTER TYPE public."ChannelType" OWNER TO wms_user;

--
-- Name: CustomerType; Type: TYPE; Schema: public; Owner: wms_user
--

CREATE TYPE public."CustomerType" AS ENUM (
    'B2C',
    'B2B'
);


ALTER TYPE public."CustomerType" OWNER TO wms_user;

--
-- Name: InventoryStatus; Type: TYPE; Schema: public; Owner: wms_user
--

CREATE TYPE public."InventoryStatus" AS ENUM (
    'AVAILABLE',
    'RESERVED',
    'QUARANTINE',
    'DAMAGED',
    'EXPIRED'
);


ALTER TYPE public."InventoryStatus" OWNER TO wms_user;

--
-- Name: OrderPriority; Type: TYPE; Schema: public; Owner: wms_user
--

CREATE TYPE public."OrderPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


ALTER TYPE public."OrderPriority" OWNER TO wms_user;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: wms_user
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'ALLOCATED',
    'PICKING',
    'PACKING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
);


ALTER TYPE public."OrderStatus" OWNER TO wms_user;

--
-- Name: PickItemStatus; Type: TYPE; Schema: public; Owner: wms_user
--

CREATE TYPE public."PickItemStatus" AS ENUM (
    'PENDING',
    'PICKED',
    'SHORT_PICKED',
    'SKIPPED'
);


ALTER TYPE public."PickItemStatus" OWNER TO wms_user;

--
-- Name: PickListStatus; Type: TYPE; Schema: public; Owner: wms_user
--

CREATE TYPE public."PickListStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."PickListStatus" OWNER TO wms_user;

--
-- Name: PickListType; Type: TYPE; Schema: public; Owner: wms_user
--

CREATE TYPE public."PickListType" AS ENUM (
    'SINGLE',
    'BATCH',
    'WAVE',
    'ZONE'
);


ALTER TYPE public."PickListType" OWNER TO wms_user;

--
-- Name: ProductStatus; Type: TYPE; Schema: public; Owner: wms_user
--

CREATE TYPE public."ProductStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'DISCONTINUED'
);


ALTER TYPE public."ProductStatus" OWNER TO wms_user;

--
-- Name: ProductType; Type: TYPE; Schema: public; Owner: wms_user
--

CREATE TYPE public."ProductType" AS ENUM (
    'SIMPLE',
    'VARIANT',
    'BUNDLE'
);


ALTER TYPE public."ProductType" OWNER TO wms_user;

--
-- Name: ReplenTaskStatus; Type: TYPE; Schema: public; Owner: wms_user
--

CREATE TYPE public."ReplenTaskStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."ReplenTaskStatus" OWNER TO wms_user;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: wms_user
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'USER',
    'PICKER',
    'PACKER',
    'MANAGER'
);


ALTER TYPE public."Role" OWNER TO wms_user;

--
-- Name: TransferStatus; Type: TYPE; Schema: public; Owner: wms_user
--

CREATE TYPE public."TransferStatus" AS ENUM (
    'PENDING',
    'IN_TRANSIT',
    'RECEIVING',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."TransferStatus" OWNER TO wms_user;

--
-- Name: TransferType; Type: TYPE; Schema: public; Owner: wms_user
--

CREATE TYPE public."TransferType" AS ENUM (
    'WAREHOUSE',
    'FBA_PREP',
    'FBA_SHIPMENT'
);


ALTER TYPE public."TransferType" OWNER TO wms_user;

--
-- Name: WarehouseStatus; Type: TYPE; Schema: public; Owner: wms_user
--

CREATE TYPE public."WarehouseStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'MAINTENANCE'
);


ALTER TYPE public."WarehouseStatus" OWNER TO wms_user;

--
-- Name: WarehouseType; Type: TYPE; Schema: public; Owner: wms_user
--

CREATE TYPE public."WarehouseType" AS ENUM (
    'MAIN',
    'PREP',
    'RETURNS',
    'OVERFLOW'
);


ALTER TYPE public."WarehouseType" OWNER TO wms_user;

--
-- Name: ZoneType; Type: TYPE; Schema: public; Owner: wms_user
--

CREATE TYPE public."ZoneType" AS ENUM (
    'STANDARD',
    'COLD',
    'FROZEN',
    'HAZMAT',
    'QUARANTINE'
);


ALTER TYPE public."ZoneType" OWNER TO wms_user;

--
-- Name: gen_hasura_uuid(); Type: FUNCTION; Schema: hdb_catalog; Owner: wms_user
--

CREATE FUNCTION hdb_catalog.gen_hasura_uuid() RETURNS uuid
    LANGUAGE sql
    AS $$select gen_random_uuid()$$;


ALTER FUNCTION hdb_catalog.gen_hasura_uuid() OWNER TO wms_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: hdb_action_log; Type: TABLE; Schema: hdb_catalog; Owner: wms_user
--

CREATE TABLE hdb_catalog.hdb_action_log (
    id uuid DEFAULT hdb_catalog.gen_hasura_uuid() NOT NULL,
    action_name text,
    input_payload jsonb NOT NULL,
    request_headers jsonb NOT NULL,
    session_variables jsonb NOT NULL,
    response_payload jsonb,
    errors jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    response_received_at timestamp with time zone,
    status text NOT NULL,
    CONSTRAINT hdb_action_log_status_check CHECK ((status = ANY (ARRAY['created'::text, 'processing'::text, 'completed'::text, 'error'::text])))
);


ALTER TABLE hdb_catalog.hdb_action_log OWNER TO wms_user;

--
-- Name: hdb_cron_event_invocation_logs; Type: TABLE; Schema: hdb_catalog; Owner: wms_user
--

CREATE TABLE hdb_catalog.hdb_cron_event_invocation_logs (
    id text DEFAULT hdb_catalog.gen_hasura_uuid() NOT NULL,
    event_id text,
    status integer,
    request json,
    response json,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE hdb_catalog.hdb_cron_event_invocation_logs OWNER TO wms_user;

--
-- Name: hdb_cron_events; Type: TABLE; Schema: hdb_catalog; Owner: wms_user
--

CREATE TABLE hdb_catalog.hdb_cron_events (
    id text DEFAULT hdb_catalog.gen_hasura_uuid() NOT NULL,
    trigger_name text NOT NULL,
    scheduled_time timestamp with time zone NOT NULL,
    status text DEFAULT 'scheduled'::text NOT NULL,
    tries integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    next_retry_at timestamp with time zone,
    CONSTRAINT valid_status CHECK ((status = ANY (ARRAY['scheduled'::text, 'locked'::text, 'delivered'::text, 'error'::text, 'dead'::text])))
);


ALTER TABLE hdb_catalog.hdb_cron_events OWNER TO wms_user;

--
-- Name: hdb_metadata; Type: TABLE; Schema: hdb_catalog; Owner: wms_user
--

CREATE TABLE hdb_catalog.hdb_metadata (
    id integer NOT NULL,
    metadata json NOT NULL,
    resource_version integer DEFAULT 1 NOT NULL
);


ALTER TABLE hdb_catalog.hdb_metadata OWNER TO wms_user;

--
-- Name: hdb_scheduled_event_invocation_logs; Type: TABLE; Schema: hdb_catalog; Owner: wms_user
--

CREATE TABLE hdb_catalog.hdb_scheduled_event_invocation_logs (
    id text DEFAULT hdb_catalog.gen_hasura_uuid() NOT NULL,
    event_id text,
    status integer,
    request json,
    response json,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE hdb_catalog.hdb_scheduled_event_invocation_logs OWNER TO wms_user;

--
-- Name: hdb_scheduled_events; Type: TABLE; Schema: hdb_catalog; Owner: wms_user
--

CREATE TABLE hdb_catalog.hdb_scheduled_events (
    id text DEFAULT hdb_catalog.gen_hasura_uuid() NOT NULL,
    webhook_conf json NOT NULL,
    scheduled_time timestamp with time zone NOT NULL,
    retry_conf json,
    payload json,
    header_conf json,
    status text DEFAULT 'scheduled'::text NOT NULL,
    tries integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    next_retry_at timestamp with time zone,
    comment text,
    CONSTRAINT valid_status CHECK ((status = ANY (ARRAY['scheduled'::text, 'locked'::text, 'delivered'::text, 'error'::text, 'dead'::text])))
);


ALTER TABLE hdb_catalog.hdb_scheduled_events OWNER TO wms_user;

--
-- Name: hdb_schema_notifications; Type: TABLE; Schema: hdb_catalog; Owner: wms_user
--

CREATE TABLE hdb_catalog.hdb_schema_notifications (
    id integer NOT NULL,
    notification json NOT NULL,
    resource_version integer DEFAULT 1 NOT NULL,
    instance_id uuid NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT hdb_schema_notifications_id_check CHECK ((id = 1))
);


ALTER TABLE hdb_catalog.hdb_schema_notifications OWNER TO wms_user;

--
-- Name: hdb_version; Type: TABLE; Schema: hdb_catalog; Owner: wms_user
--

CREATE TABLE hdb_catalog.hdb_version (
    hasura_uuid uuid DEFAULT hdb_catalog.gen_hasura_uuid() NOT NULL,
    version text NOT NULL,
    upgraded_on timestamp with time zone NOT NULL,
    cli_state jsonb DEFAULT '{}'::jsonb NOT NULL,
    console_state jsonb DEFAULT '{}'::jsonb NOT NULL,
    ee_client_id text,
    ee_client_secret text
);


ALTER TABLE hdb_catalog.hdb_version OWNER TO wms_user;

--
-- Name: Brand; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public."Brand" (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    description text,
    "companyId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Brand" OWNER TO wms_user;

--
-- Name: BundleItem; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public."BundleItem" (
    id text NOT NULL,
    "parentId" text NOT NULL,
    "childId" text NOT NULL,
    quantity integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."BundleItem" OWNER TO wms_user;

--
-- Name: ChannelPrice; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public."ChannelPrice" (
    id text NOT NULL,
    "productId" text NOT NULL,
    "channelId" text NOT NULL,
    "sellingPrice" double precision NOT NULL,
    "productCost" double precision,
    "laborCost" double precision,
    "materialCost" double precision,
    "shippingCost" double precision,
    "totalCost" double precision,
    "grossProfit" double precision,
    "profitMargin" double precision,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ChannelPrice" OWNER TO wms_user;

--
-- Name: Company; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public."Company" (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    description text,
    address text,
    phone text,
    email text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Company" OWNER TO wms_user;

--
-- Name: Customer; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public."Customer" (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    email text,
    phone text,
    address text,
    "companyId" text NOT NULL,
    "customerType" public."CustomerType" DEFAULT 'B2C'::public."CustomerType" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Customer" OWNER TO wms_user;

--
-- Name: Inventory; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public."Inventory" (
    id text NOT NULL,
    "productId" text NOT NULL,
    "warehouseId" text NOT NULL,
    "locationId" text,
    "lotNumber" text,
    "batchNumber" text,
    "serialNumber" text,
    "bestBeforeDate" timestamp(3) without time zone,
    "receivedDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    "availableQuantity" integer DEFAULT 0 NOT NULL,
    "reservedQuantity" integer DEFAULT 0 NOT NULL,
    status public."InventoryStatus" DEFAULT 'AVAILABLE'::public."InventoryStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Inventory" OWNER TO wms_user;

--
-- Name: Location; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public."Location" (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    "warehouseId" text NOT NULL,
    "zoneId" text,
    aisle text,
    rack text,
    shelf text,
    bin text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Location" OWNER TO wms_user;

--
-- Name: PickItem; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public."PickItem" (
    id text NOT NULL,
    "pickListId" text NOT NULL,
    "productId" text NOT NULL,
    "locationId" text,
    "selectedBBDate" timestamp(3) without time zone,
    "lotNumber" text,
    "quantityRequired" integer NOT NULL,
    "quantityPicked" integer DEFAULT 0 NOT NULL,
    status public."PickItemStatus" DEFAULT 'PENDING'::public."PickItemStatus" NOT NULL,
    "sequenceNumber" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PickItem" OWNER TO wms_user;

--
-- Name: PickList; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public."PickList" (
    id text NOT NULL,
    "pickListNumber" text NOT NULL,
    type public."PickListType" DEFAULT 'SINGLE'::public."PickListType" NOT NULL,
    "orderId" text,
    "assignedUserId" text,
    status public."PickListStatus" DEFAULT 'PENDING'::public."PickListStatus" NOT NULL,
    priority public."OrderPriority" DEFAULT 'MEDIUM'::public."OrderPriority" NOT NULL,
    "enforceSingleBBDate" boolean DEFAULT false NOT NULL,
    "startedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PickList" OWNER TO wms_user;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    sku text NOT NULL,
    name text NOT NULL,
    description text,
    barcode text,
    "companyId" text NOT NULL,
    "brandId" text,
    type public."ProductType" DEFAULT 'SIMPLE'::public."ProductType" NOT NULL,
    status public."ProductStatus" DEFAULT 'ACTIVE'::public."ProductStatus" NOT NULL,
    length double precision,
    width double precision,
    height double precision,
    weight double precision,
    "dimensionUnit" text DEFAULT 'cm'::text,
    "weightUnit" text DEFAULT 'kg'::text,
    "costPrice" double precision,
    "sellingPrice" double precision,
    currency text DEFAULT 'GBP'::text NOT NULL,
    "isPerishable" boolean DEFAULT false NOT NULL,
    "requiresBatch" boolean DEFAULT false NOT NULL,
    "requiresSerial" boolean DEFAULT false NOT NULL,
    "shelfLifeDays" integer,
    images text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Product" OWNER TO wms_user;

--
-- Name: ReplenishmentConfig; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public."ReplenishmentConfig" (
    id text NOT NULL,
    "productId" text NOT NULL,
    "minStockLevel" integer NOT NULL,
    "maxStockLevel" integer NOT NULL,
    "reorderPoint" integer NOT NULL,
    "reorderQuantity" integer NOT NULL,
    "autoCreateTasks" boolean DEFAULT true NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ReplenishmentConfig" OWNER TO wms_user;

--
-- Name: ReplenishmentTask; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public."ReplenishmentTask" (
    id text NOT NULL,
    "taskNumber" text NOT NULL,
    "productId" text NOT NULL,
    "fromLocation" text,
    "toLocation" text,
    "quantityNeeded" integer NOT NULL,
    "quantityMoved" integer DEFAULT 0 NOT NULL,
    status public."ReplenTaskStatus" DEFAULT 'PENDING'::public."ReplenTaskStatus" NOT NULL,
    priority public."OrderPriority" DEFAULT 'MEDIUM'::public."OrderPriority" NOT NULL,
    "assignedUserId" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ReplenishmentTask" OWNER TO wms_user;

--
-- Name: SalesChannel; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public."SalesChannel" (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    type public."ChannelType" NOT NULL,
    "referralFeePercent" double precision,
    "fixedFee" double precision,
    "fulfillmentFeePerUnit" double precision,
    "storageFeePerUnit" double precision,
    "additionalFees" jsonb,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SalesChannel" OWNER TO wms_user;

--
-- Name: SalesOrder; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public."SalesOrder" (
    id text NOT NULL,
    "orderNumber" text NOT NULL,
    "customerId" text NOT NULL,
    "isWholesale" boolean DEFAULT false NOT NULL,
    "salesChannel" text,
    "externalOrderId" text,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    priority public."OrderPriority" DEFAULT 'MEDIUM'::public."OrderPriority" NOT NULL,
    subtotal double precision DEFAULT 0 NOT NULL,
    "taxAmount" double precision DEFAULT 0 NOT NULL,
    "shippingCost" double precision DEFAULT 0 NOT NULL,
    "discountAmount" double precision DEFAULT 0 NOT NULL,
    "totalAmount" double precision DEFAULT 0 NOT NULL,
    "shippingAddress" text,
    "shippingMethod" text,
    "trackingNumber" text,
    notes text,
    "orderDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "requiredDate" timestamp(3) without time zone,
    "shippedDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SalesOrder" OWNER TO wms_user;

--
-- Name: SalesOrderItem; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public."SalesOrderItem" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer NOT NULL,
    "unitPrice" double precision NOT NULL,
    discount double precision DEFAULT 0 NOT NULL,
    tax double precision DEFAULT 0 NOT NULL,
    "totalPrice" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SalesOrderItem" OWNER TO wms_user;

--
-- Name: Supplier; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public."Supplier" (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    email text,
    phone text,
    address text,
    "companyId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Supplier" OWNER TO wms_user;

--
-- Name: Transfer; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public."Transfer" (
    id text NOT NULL,
    "transferNumber" text NOT NULL,
    type public."TransferType" DEFAULT 'WAREHOUSE'::public."TransferType" NOT NULL,
    "fromWarehouseId" text NOT NULL,
    "toWarehouseId" text NOT NULL,
    status public."TransferStatus" DEFAULT 'PENDING'::public."TransferStatus" NOT NULL,
    "fbaShipmentId" text,
    "fbaDestination" text,
    "shipmentBuilt" boolean DEFAULT false NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "shippedAt" timestamp(3) without time zone,
    "receivedAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Transfer" OWNER TO wms_user;

--
-- Name: TransferItem; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public."TransferItem" (
    id text NOT NULL,
    "transferId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer NOT NULL,
    "receivedQuantity" integer DEFAULT 0 NOT NULL,
    "isFBABundle" boolean DEFAULT false NOT NULL,
    "fbaSku" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TransferItem" OWNER TO wms_user;

--
-- Name: User; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    role public."Role" DEFAULT 'USER'::public."Role" NOT NULL,
    "companyId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO wms_user;

--
-- Name: Warehouse; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public."Warehouse" (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    type public."WarehouseType" DEFAULT 'MAIN'::public."WarehouseType" NOT NULL,
    "companyId" text NOT NULL,
    address text,
    phone text,
    capacity integer,
    status public."WarehouseStatus" DEFAULT 'ACTIVE'::public."WarehouseStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Warehouse" OWNER TO wms_user;

--
-- Name: Zone; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public."Zone" (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    "warehouseId" text NOT NULL,
    "zoneType" public."ZoneType" DEFAULT 'STANDARD'::public."ZoneType" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Zone" OWNER TO wms_user;

--
-- Name: directus_access; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_access (
    id uuid NOT NULL,
    role uuid,
    "user" uuid,
    policy uuid NOT NULL,
    sort integer
);


ALTER TABLE public.directus_access OWNER TO wms_user;

--
-- Name: directus_activity; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_activity (
    id integer NOT NULL,
    action character varying(45) NOT NULL,
    "user" uuid,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ip character varying(50),
    user_agent text,
    collection character varying(64) NOT NULL,
    item character varying(255) NOT NULL,
    origin character varying(255)
);


ALTER TABLE public.directus_activity OWNER TO wms_user;

--
-- Name: directus_activity_id_seq; Type: SEQUENCE; Schema: public; Owner: wms_user
--

CREATE SEQUENCE public.directus_activity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.directus_activity_id_seq OWNER TO wms_user;

--
-- Name: directus_activity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: wms_user
--

ALTER SEQUENCE public.directus_activity_id_seq OWNED BY public.directus_activity.id;


--
-- Name: directus_collections; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_collections (
    collection character varying(64) NOT NULL,
    icon character varying(64),
    note text,
    display_template character varying(255),
    hidden boolean DEFAULT false NOT NULL,
    singleton boolean DEFAULT false NOT NULL,
    translations json,
    archive_field character varying(64),
    archive_app_filter boolean DEFAULT true NOT NULL,
    archive_value character varying(255),
    unarchive_value character varying(255),
    sort_field character varying(64),
    accountability character varying(255) DEFAULT 'all'::character varying,
    color character varying(255),
    item_duplication_fields json,
    sort integer,
    "group" character varying(64),
    collapse character varying(255) DEFAULT 'open'::character varying NOT NULL,
    preview_url character varying(255),
    versioning boolean DEFAULT false NOT NULL
);


ALTER TABLE public.directus_collections OWNER TO wms_user;

--
-- Name: directus_comments; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_comments (
    id uuid NOT NULL,
    collection character varying(64) NOT NULL,
    item character varying(255) NOT NULL,
    comment text NOT NULL,
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    date_updated timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_created uuid,
    user_updated uuid
);


ALTER TABLE public.directus_comments OWNER TO wms_user;

--
-- Name: directus_dashboards; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_dashboards (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    icon character varying(64) DEFAULT 'dashboard'::character varying NOT NULL,
    note text,
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_created uuid,
    color character varying(255)
);


ALTER TABLE public.directus_dashboards OWNER TO wms_user;

--
-- Name: directus_extensions; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_extensions (
    enabled boolean DEFAULT true NOT NULL,
    id uuid NOT NULL,
    folder character varying(255) NOT NULL,
    source character varying(255) NOT NULL,
    bundle uuid
);


ALTER TABLE public.directus_extensions OWNER TO wms_user;

--
-- Name: directus_fields; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_fields (
    id integer NOT NULL,
    collection character varying(64) NOT NULL,
    field character varying(64) NOT NULL,
    special character varying(64),
    interface character varying(64),
    options json,
    display character varying(64),
    display_options json,
    readonly boolean DEFAULT false NOT NULL,
    hidden boolean DEFAULT false NOT NULL,
    sort integer,
    width character varying(30) DEFAULT 'full'::character varying,
    translations json,
    note text,
    conditions json,
    required boolean DEFAULT false,
    "group" character varying(64),
    validation json,
    validation_message text
);


ALTER TABLE public.directus_fields OWNER TO wms_user;

--
-- Name: directus_fields_id_seq; Type: SEQUENCE; Schema: public; Owner: wms_user
--

CREATE SEQUENCE public.directus_fields_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.directus_fields_id_seq OWNER TO wms_user;

--
-- Name: directus_fields_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: wms_user
--

ALTER SEQUENCE public.directus_fields_id_seq OWNED BY public.directus_fields.id;


--
-- Name: directus_files; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_files (
    id uuid NOT NULL,
    storage character varying(255) NOT NULL,
    filename_disk character varying(255),
    filename_download character varying(255) NOT NULL,
    title character varying(255),
    type character varying(255),
    folder uuid,
    uploaded_by uuid,
    created_on timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    modified_by uuid,
    modified_on timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    charset character varying(50),
    filesize bigint,
    width integer,
    height integer,
    duration integer,
    embed character varying(200),
    description text,
    location text,
    tags text,
    metadata json,
    focal_point_x integer,
    focal_point_y integer,
    tus_id character varying(64),
    tus_data json,
    uploaded_on timestamp with time zone
);


ALTER TABLE public.directus_files OWNER TO wms_user;

--
-- Name: directus_flows; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_flows (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    icon character varying(64),
    color character varying(255),
    description text,
    status character varying(255) DEFAULT 'active'::character varying NOT NULL,
    trigger character varying(255),
    accountability character varying(255) DEFAULT 'all'::character varying,
    options json,
    operation uuid,
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_created uuid
);


ALTER TABLE public.directus_flows OWNER TO wms_user;

--
-- Name: directus_folders; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_folders (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    parent uuid
);


ALTER TABLE public.directus_folders OWNER TO wms_user;

--
-- Name: directus_migrations; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_migrations (
    version character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.directus_migrations OWNER TO wms_user;

--
-- Name: directus_notifications; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_notifications (
    id integer NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(255) DEFAULT 'inbox'::character varying,
    recipient uuid NOT NULL,
    sender uuid,
    subject character varying(255) NOT NULL,
    message text,
    collection character varying(64),
    item character varying(255)
);


ALTER TABLE public.directus_notifications OWNER TO wms_user;

--
-- Name: directus_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: wms_user
--

CREATE SEQUENCE public.directus_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.directus_notifications_id_seq OWNER TO wms_user;

--
-- Name: directus_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: wms_user
--

ALTER SEQUENCE public.directus_notifications_id_seq OWNED BY public.directus_notifications.id;


--
-- Name: directus_operations; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_operations (
    id uuid NOT NULL,
    name character varying(255),
    key character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    position_x integer NOT NULL,
    position_y integer NOT NULL,
    options json,
    resolve uuid,
    reject uuid,
    flow uuid NOT NULL,
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_created uuid
);


ALTER TABLE public.directus_operations OWNER TO wms_user;

--
-- Name: directus_panels; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_panels (
    id uuid NOT NULL,
    dashboard uuid NOT NULL,
    name character varying(255),
    icon character varying(64) DEFAULT NULL::character varying,
    color character varying(10),
    show_header boolean DEFAULT false NOT NULL,
    note text,
    type character varying(255) NOT NULL,
    position_x integer NOT NULL,
    position_y integer NOT NULL,
    width integer NOT NULL,
    height integer NOT NULL,
    options json,
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_created uuid
);


ALTER TABLE public.directus_panels OWNER TO wms_user;

--
-- Name: directus_permissions; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_permissions (
    id integer NOT NULL,
    collection character varying(64) NOT NULL,
    action character varying(10) NOT NULL,
    permissions json,
    validation json,
    presets json,
    fields text,
    policy uuid NOT NULL
);


ALTER TABLE public.directus_permissions OWNER TO wms_user;

--
-- Name: directus_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: wms_user
--

CREATE SEQUENCE public.directus_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.directus_permissions_id_seq OWNER TO wms_user;

--
-- Name: directus_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: wms_user
--

ALTER SEQUENCE public.directus_permissions_id_seq OWNED BY public.directus_permissions.id;


--
-- Name: directus_policies; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_policies (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    icon character varying(64) DEFAULT 'badge'::character varying NOT NULL,
    description text,
    ip_access text,
    enforce_tfa boolean DEFAULT false NOT NULL,
    admin_access boolean DEFAULT false NOT NULL,
    app_access boolean DEFAULT false NOT NULL
);


ALTER TABLE public.directus_policies OWNER TO wms_user;

--
-- Name: directus_presets; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_presets (
    id integer NOT NULL,
    bookmark character varying(255),
    "user" uuid,
    role uuid,
    collection character varying(64),
    search character varying(100),
    layout character varying(100) DEFAULT 'tabular'::character varying,
    layout_query json,
    layout_options json,
    refresh_interval integer,
    filter json,
    icon character varying(64) DEFAULT 'bookmark'::character varying,
    color character varying(255)
);


ALTER TABLE public.directus_presets OWNER TO wms_user;

--
-- Name: directus_presets_id_seq; Type: SEQUENCE; Schema: public; Owner: wms_user
--

CREATE SEQUENCE public.directus_presets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.directus_presets_id_seq OWNER TO wms_user;

--
-- Name: directus_presets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: wms_user
--

ALTER SEQUENCE public.directus_presets_id_seq OWNED BY public.directus_presets.id;


--
-- Name: directus_relations; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_relations (
    id integer NOT NULL,
    many_collection character varying(64) NOT NULL,
    many_field character varying(64) NOT NULL,
    one_collection character varying(64),
    one_field character varying(64),
    one_collection_field character varying(64),
    one_allowed_collections text,
    junction_field character varying(64),
    sort_field character varying(64),
    one_deselect_action character varying(255) DEFAULT 'nullify'::character varying NOT NULL
);


ALTER TABLE public.directus_relations OWNER TO wms_user;

--
-- Name: directus_relations_id_seq; Type: SEQUENCE; Schema: public; Owner: wms_user
--

CREATE SEQUENCE public.directus_relations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.directus_relations_id_seq OWNER TO wms_user;

--
-- Name: directus_relations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: wms_user
--

ALTER SEQUENCE public.directus_relations_id_seq OWNED BY public.directus_relations.id;


--
-- Name: directus_revisions; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_revisions (
    id integer NOT NULL,
    activity integer NOT NULL,
    collection character varying(64) NOT NULL,
    item character varying(255) NOT NULL,
    data json,
    delta json,
    parent integer,
    version uuid
);


ALTER TABLE public.directus_revisions OWNER TO wms_user;

--
-- Name: directus_revisions_id_seq; Type: SEQUENCE; Schema: public; Owner: wms_user
--

CREATE SEQUENCE public.directus_revisions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.directus_revisions_id_seq OWNER TO wms_user;

--
-- Name: directus_revisions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: wms_user
--

ALTER SEQUENCE public.directus_revisions_id_seq OWNED BY public.directus_revisions.id;


--
-- Name: directus_roles; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_roles (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    icon character varying(64) DEFAULT 'supervised_user_circle'::character varying NOT NULL,
    description text,
    parent uuid
);


ALTER TABLE public.directus_roles OWNER TO wms_user;

--
-- Name: directus_sessions; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_sessions (
    token character varying(64) NOT NULL,
    "user" uuid,
    expires timestamp with time zone NOT NULL,
    ip character varying(255),
    user_agent text,
    share uuid,
    origin character varying(255),
    next_token character varying(64)
);


ALTER TABLE public.directus_sessions OWNER TO wms_user;

--
-- Name: directus_settings; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_settings (
    id integer NOT NULL,
    project_name character varying(100) DEFAULT 'Directus'::character varying NOT NULL,
    project_url character varying(255),
    project_color character varying(255) DEFAULT '#6644FF'::character varying NOT NULL,
    project_logo uuid,
    public_foreground uuid,
    public_background uuid,
    public_note text,
    auth_login_attempts integer DEFAULT 25,
    auth_password_policy character varying(100),
    storage_asset_transform character varying(7) DEFAULT 'all'::character varying,
    storage_asset_presets json,
    custom_css text,
    storage_default_folder uuid,
    basemaps json,
    mapbox_key character varying(255),
    module_bar json,
    project_descriptor character varying(100),
    default_language character varying(255) DEFAULT 'en-US'::character varying NOT NULL,
    custom_aspect_ratios json,
    public_favicon uuid,
    default_appearance character varying(255) DEFAULT 'auto'::character varying NOT NULL,
    default_theme_light character varying(255),
    theme_light_overrides json,
    default_theme_dark character varying(255),
    theme_dark_overrides json,
    report_error_url character varying(255),
    report_bug_url character varying(255),
    report_feature_url character varying(255),
    public_registration boolean DEFAULT false NOT NULL,
    public_registration_verify_email boolean DEFAULT true NOT NULL,
    public_registration_role uuid,
    public_registration_email_filter json
);


ALTER TABLE public.directus_settings OWNER TO wms_user;

--
-- Name: directus_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: wms_user
--

CREATE SEQUENCE public.directus_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.directus_settings_id_seq OWNER TO wms_user;

--
-- Name: directus_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: wms_user
--

ALTER SEQUENCE public.directus_settings_id_seq OWNED BY public.directus_settings.id;


--
-- Name: directus_shares; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_shares (
    id uuid NOT NULL,
    name character varying(255),
    collection character varying(64) NOT NULL,
    item character varying(255) NOT NULL,
    role uuid,
    password character varying(255),
    user_created uuid,
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    date_start timestamp with time zone,
    date_end timestamp with time zone,
    times_used integer DEFAULT 0,
    max_uses integer
);


ALTER TABLE public.directus_shares OWNER TO wms_user;

--
-- Name: directus_translations; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_translations (
    id uuid NOT NULL,
    language character varying(255) NOT NULL,
    key character varying(255) NOT NULL,
    value text NOT NULL
);


ALTER TABLE public.directus_translations OWNER TO wms_user;

--
-- Name: directus_users; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_users (
    id uuid NOT NULL,
    first_name character varying(50),
    last_name character varying(50),
    email character varying(128),
    password character varying(255),
    location character varying(255),
    title character varying(50),
    description text,
    tags json,
    avatar uuid,
    language character varying(255) DEFAULT NULL::character varying,
    tfa_secret character varying(255),
    status character varying(16) DEFAULT 'active'::character varying NOT NULL,
    role uuid,
    token character varying(255),
    last_access timestamp with time zone,
    last_page character varying(255),
    provider character varying(128) DEFAULT 'default'::character varying NOT NULL,
    external_identifier character varying(255),
    auth_data json,
    email_notifications boolean DEFAULT true,
    appearance character varying(255),
    theme_dark character varying(255),
    theme_light character varying(255),
    theme_light_overrides json,
    theme_dark_overrides json
);


ALTER TABLE public.directus_users OWNER TO wms_user;

--
-- Name: directus_versions; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_versions (
    id uuid NOT NULL,
    key character varying(64) NOT NULL,
    name character varying(255),
    collection character varying(64) NOT NULL,
    item character varying(255) NOT NULL,
    hash character varying(255),
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    date_updated timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_created uuid,
    user_updated uuid,
    delta json
);


ALTER TABLE public.directus_versions OWNER TO wms_user;

--
-- Name: directus_webhooks; Type: TABLE; Schema: public; Owner: wms_user
--

CREATE TABLE public.directus_webhooks (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    method character varying(10) DEFAULT 'POST'::character varying NOT NULL,
    url character varying(255) NOT NULL,
    status character varying(10) DEFAULT 'active'::character varying NOT NULL,
    data boolean DEFAULT true NOT NULL,
    actions character varying(100) NOT NULL,
    collections character varying(255) NOT NULL,
    headers json,
    was_active_before_deprecation boolean DEFAULT false NOT NULL,
    migrated_flow uuid
);


ALTER TABLE public.directus_webhooks OWNER TO wms_user;

--
-- Name: directus_webhooks_id_seq; Type: SEQUENCE; Schema: public; Owner: wms_user
--

CREATE SEQUENCE public.directus_webhooks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.directus_webhooks_id_seq OWNER TO wms_user;

--
-- Name: directus_webhooks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: wms_user
--

ALTER SEQUENCE public.directus_webhooks_id_seq OWNED BY public.directus_webhooks.id;


--
-- Name: directus_activity id; Type: DEFAULT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_activity ALTER COLUMN id SET DEFAULT nextval('public.directus_activity_id_seq'::regclass);


--
-- Name: directus_fields id; Type: DEFAULT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_fields ALTER COLUMN id SET DEFAULT nextval('public.directus_fields_id_seq'::regclass);


--
-- Name: directus_notifications id; Type: DEFAULT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_notifications ALTER COLUMN id SET DEFAULT nextval('public.directus_notifications_id_seq'::regclass);


--
-- Name: directus_permissions id; Type: DEFAULT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_permissions ALTER COLUMN id SET DEFAULT nextval('public.directus_permissions_id_seq'::regclass);


--
-- Name: directus_presets id; Type: DEFAULT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_presets ALTER COLUMN id SET DEFAULT nextval('public.directus_presets_id_seq'::regclass);


--
-- Name: directus_relations id; Type: DEFAULT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_relations ALTER COLUMN id SET DEFAULT nextval('public.directus_relations_id_seq'::regclass);


--
-- Name: directus_revisions id; Type: DEFAULT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_revisions ALTER COLUMN id SET DEFAULT nextval('public.directus_revisions_id_seq'::regclass);


--
-- Name: directus_settings id; Type: DEFAULT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_settings ALTER COLUMN id SET DEFAULT nextval('public.directus_settings_id_seq'::regclass);


--
-- Name: directus_webhooks id; Type: DEFAULT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_webhooks ALTER COLUMN id SET DEFAULT nextval('public.directus_webhooks_id_seq'::regclass);


--
-- Name: hdb_action_log hdb_action_log_pkey; Type: CONSTRAINT; Schema: hdb_catalog; Owner: wms_user
--

ALTER TABLE ONLY hdb_catalog.hdb_action_log
    ADD CONSTRAINT hdb_action_log_pkey PRIMARY KEY (id);


--
-- Name: hdb_cron_event_invocation_logs hdb_cron_event_invocation_logs_pkey; Type: CONSTRAINT; Schema: hdb_catalog; Owner: wms_user
--

ALTER TABLE ONLY hdb_catalog.hdb_cron_event_invocation_logs
    ADD CONSTRAINT hdb_cron_event_invocation_logs_pkey PRIMARY KEY (id);


--
-- Name: hdb_cron_events hdb_cron_events_pkey; Type: CONSTRAINT; Schema: hdb_catalog; Owner: wms_user
--

ALTER TABLE ONLY hdb_catalog.hdb_cron_events
    ADD CONSTRAINT hdb_cron_events_pkey PRIMARY KEY (id);


--
-- Name: hdb_metadata hdb_metadata_pkey; Type: CONSTRAINT; Schema: hdb_catalog; Owner: wms_user
--

ALTER TABLE ONLY hdb_catalog.hdb_metadata
    ADD CONSTRAINT hdb_metadata_pkey PRIMARY KEY (id);


--
-- Name: hdb_metadata hdb_metadata_resource_version_key; Type: CONSTRAINT; Schema: hdb_catalog; Owner: wms_user
--

ALTER TABLE ONLY hdb_catalog.hdb_metadata
    ADD CONSTRAINT hdb_metadata_resource_version_key UNIQUE (resource_version);


--
-- Name: hdb_scheduled_event_invocation_logs hdb_scheduled_event_invocation_logs_pkey; Type: CONSTRAINT; Schema: hdb_catalog; Owner: wms_user
--

ALTER TABLE ONLY hdb_catalog.hdb_scheduled_event_invocation_logs
    ADD CONSTRAINT hdb_scheduled_event_invocation_logs_pkey PRIMARY KEY (id);


--
-- Name: hdb_scheduled_events hdb_scheduled_events_pkey; Type: CONSTRAINT; Schema: hdb_catalog; Owner: wms_user
--

ALTER TABLE ONLY hdb_catalog.hdb_scheduled_events
    ADD CONSTRAINT hdb_scheduled_events_pkey PRIMARY KEY (id);


--
-- Name: hdb_schema_notifications hdb_schema_notifications_pkey; Type: CONSTRAINT; Schema: hdb_catalog; Owner: wms_user
--

ALTER TABLE ONLY hdb_catalog.hdb_schema_notifications
    ADD CONSTRAINT hdb_schema_notifications_pkey PRIMARY KEY (id);


--
-- Name: hdb_version hdb_version_pkey; Type: CONSTRAINT; Schema: hdb_catalog; Owner: wms_user
--

ALTER TABLE ONLY hdb_catalog.hdb_version
    ADD CONSTRAINT hdb_version_pkey PRIMARY KEY (hasura_uuid);


--
-- Name: Brand Brand_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."Brand"
    ADD CONSTRAINT "Brand_pkey" PRIMARY KEY (id);


--
-- Name: BundleItem BundleItem_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."BundleItem"
    ADD CONSTRAINT "BundleItem_pkey" PRIMARY KEY (id);


--
-- Name: ChannelPrice ChannelPrice_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."ChannelPrice"
    ADD CONSTRAINT "ChannelPrice_pkey" PRIMARY KEY (id);


--
-- Name: Company Company_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."Company"
    ADD CONSTRAINT "Company_pkey" PRIMARY KEY (id);


--
-- Name: Customer Customer_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_pkey" PRIMARY KEY (id);


--
-- Name: Inventory Inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."Inventory"
    ADD CONSTRAINT "Inventory_pkey" PRIMARY KEY (id);


--
-- Name: Location Location_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."Location"
    ADD CONSTRAINT "Location_pkey" PRIMARY KEY (id);


--
-- Name: PickItem PickItem_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."PickItem"
    ADD CONSTRAINT "PickItem_pkey" PRIMARY KEY (id);


--
-- Name: PickList PickList_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."PickList"
    ADD CONSTRAINT "PickList_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: ReplenishmentConfig ReplenishmentConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."ReplenishmentConfig"
    ADD CONSTRAINT "ReplenishmentConfig_pkey" PRIMARY KEY (id);


--
-- Name: ReplenishmentTask ReplenishmentTask_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."ReplenishmentTask"
    ADD CONSTRAINT "ReplenishmentTask_pkey" PRIMARY KEY (id);


--
-- Name: SalesChannel SalesChannel_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."SalesChannel"
    ADD CONSTRAINT "SalesChannel_pkey" PRIMARY KEY (id);


--
-- Name: SalesOrderItem SalesOrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."SalesOrderItem"
    ADD CONSTRAINT "SalesOrderItem_pkey" PRIMARY KEY (id);


--
-- Name: SalesOrder SalesOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."SalesOrder"
    ADD CONSTRAINT "SalesOrder_pkey" PRIMARY KEY (id);


--
-- Name: Supplier Supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."Supplier"
    ADD CONSTRAINT "Supplier_pkey" PRIMARY KEY (id);


--
-- Name: TransferItem TransferItem_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."TransferItem"
    ADD CONSTRAINT "TransferItem_pkey" PRIMARY KEY (id);


--
-- Name: Transfer Transfer_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."Transfer"
    ADD CONSTRAINT "Transfer_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Warehouse Warehouse_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."Warehouse"
    ADD CONSTRAINT "Warehouse_pkey" PRIMARY KEY (id);


--
-- Name: Zone Zone_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."Zone"
    ADD CONSTRAINT "Zone_pkey" PRIMARY KEY (id);


--
-- Name: directus_access directus_access_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_access
    ADD CONSTRAINT directus_access_pkey PRIMARY KEY (id);


--
-- Name: directus_activity directus_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_activity
    ADD CONSTRAINT directus_activity_pkey PRIMARY KEY (id);


--
-- Name: directus_collections directus_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_collections
    ADD CONSTRAINT directus_collections_pkey PRIMARY KEY (collection);


--
-- Name: directus_comments directus_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_comments
    ADD CONSTRAINT directus_comments_pkey PRIMARY KEY (id);


--
-- Name: directus_dashboards directus_dashboards_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_dashboards
    ADD CONSTRAINT directus_dashboards_pkey PRIMARY KEY (id);


--
-- Name: directus_extensions directus_extensions_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_extensions
    ADD CONSTRAINT directus_extensions_pkey PRIMARY KEY (id);


--
-- Name: directus_fields directus_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_fields
    ADD CONSTRAINT directus_fields_pkey PRIMARY KEY (id);


--
-- Name: directus_files directus_files_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_files
    ADD CONSTRAINT directus_files_pkey PRIMARY KEY (id);


--
-- Name: directus_flows directus_flows_operation_unique; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_flows
    ADD CONSTRAINT directus_flows_operation_unique UNIQUE (operation);


--
-- Name: directus_flows directus_flows_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_flows
    ADD CONSTRAINT directus_flows_pkey PRIMARY KEY (id);


--
-- Name: directus_folders directus_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_folders
    ADD CONSTRAINT directus_folders_pkey PRIMARY KEY (id);


--
-- Name: directus_migrations directus_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_migrations
    ADD CONSTRAINT directus_migrations_pkey PRIMARY KEY (version);


--
-- Name: directus_notifications directus_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_notifications
    ADD CONSTRAINT directus_notifications_pkey PRIMARY KEY (id);


--
-- Name: directus_operations directus_operations_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_operations
    ADD CONSTRAINT directus_operations_pkey PRIMARY KEY (id);


--
-- Name: directus_operations directus_operations_reject_unique; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_operations
    ADD CONSTRAINT directus_operations_reject_unique UNIQUE (reject);


--
-- Name: directus_operations directus_operations_resolve_unique; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_operations
    ADD CONSTRAINT directus_operations_resolve_unique UNIQUE (resolve);


--
-- Name: directus_panels directus_panels_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_panels
    ADD CONSTRAINT directus_panels_pkey PRIMARY KEY (id);


--
-- Name: directus_permissions directus_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_permissions
    ADD CONSTRAINT directus_permissions_pkey PRIMARY KEY (id);


--
-- Name: directus_policies directus_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_policies
    ADD CONSTRAINT directus_policies_pkey PRIMARY KEY (id);


--
-- Name: directus_presets directus_presets_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_presets
    ADD CONSTRAINT directus_presets_pkey PRIMARY KEY (id);


--
-- Name: directus_relations directus_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_relations
    ADD CONSTRAINT directus_relations_pkey PRIMARY KEY (id);


--
-- Name: directus_revisions directus_revisions_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_revisions
    ADD CONSTRAINT directus_revisions_pkey PRIMARY KEY (id);


--
-- Name: directus_roles directus_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_roles
    ADD CONSTRAINT directus_roles_pkey PRIMARY KEY (id);


--
-- Name: directus_sessions directus_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_sessions
    ADD CONSTRAINT directus_sessions_pkey PRIMARY KEY (token);


--
-- Name: directus_settings directus_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_settings
    ADD CONSTRAINT directus_settings_pkey PRIMARY KEY (id);


--
-- Name: directus_shares directus_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_shares
    ADD CONSTRAINT directus_shares_pkey PRIMARY KEY (id);


--
-- Name: directus_translations directus_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_translations
    ADD CONSTRAINT directus_translations_pkey PRIMARY KEY (id);


--
-- Name: directus_users directus_users_email_unique; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_users
    ADD CONSTRAINT directus_users_email_unique UNIQUE (email);


--
-- Name: directus_users directus_users_external_identifier_unique; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_users
    ADD CONSTRAINT directus_users_external_identifier_unique UNIQUE (external_identifier);


--
-- Name: directus_users directus_users_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_users
    ADD CONSTRAINT directus_users_pkey PRIMARY KEY (id);


--
-- Name: directus_users directus_users_token_unique; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_users
    ADD CONSTRAINT directus_users_token_unique UNIQUE (token);


--
-- Name: directus_versions directus_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_versions
    ADD CONSTRAINT directus_versions_pkey PRIMARY KEY (id);


--
-- Name: directus_webhooks directus_webhooks_pkey; Type: CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_webhooks
    ADD CONSTRAINT directus_webhooks_pkey PRIMARY KEY (id);


--
-- Name: hdb_cron_event_invocation_event_id; Type: INDEX; Schema: hdb_catalog; Owner: wms_user
--

CREATE INDEX hdb_cron_event_invocation_event_id ON hdb_catalog.hdb_cron_event_invocation_logs USING btree (event_id);


--
-- Name: hdb_cron_event_status; Type: INDEX; Schema: hdb_catalog; Owner: wms_user
--

CREATE INDEX hdb_cron_event_status ON hdb_catalog.hdb_cron_events USING btree (status);


--
-- Name: hdb_cron_events_unique_scheduled; Type: INDEX; Schema: hdb_catalog; Owner: wms_user
--

CREATE UNIQUE INDEX hdb_cron_events_unique_scheduled ON hdb_catalog.hdb_cron_events USING btree (trigger_name, scheduled_time) WHERE (status = 'scheduled'::text);


--
-- Name: hdb_scheduled_event_status; Type: INDEX; Schema: hdb_catalog; Owner: wms_user
--

CREATE INDEX hdb_scheduled_event_status ON hdb_catalog.hdb_scheduled_events USING btree (status);


--
-- Name: hdb_version_one_row; Type: INDEX; Schema: hdb_catalog; Owner: wms_user
--

CREATE UNIQUE INDEX hdb_version_one_row ON hdb_catalog.hdb_version USING btree (((version IS NOT NULL)));


--
-- Name: Brand_code_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Brand_code_idx" ON public."Brand" USING btree (code);


--
-- Name: Brand_code_key; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE UNIQUE INDEX "Brand_code_key" ON public."Brand" USING btree (code);


--
-- Name: Brand_companyId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Brand_companyId_idx" ON public."Brand" USING btree ("companyId");


--
-- Name: BundleItem_childId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "BundleItem_childId_idx" ON public."BundleItem" USING btree ("childId");


--
-- Name: BundleItem_parentId_childId_key; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE UNIQUE INDEX "BundleItem_parentId_childId_key" ON public."BundleItem" USING btree ("parentId", "childId");


--
-- Name: BundleItem_parentId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "BundleItem_parentId_idx" ON public."BundleItem" USING btree ("parentId");


--
-- Name: ChannelPrice_channelId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "ChannelPrice_channelId_idx" ON public."ChannelPrice" USING btree ("channelId");


--
-- Name: ChannelPrice_productId_channelId_key; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE UNIQUE INDEX "ChannelPrice_productId_channelId_key" ON public."ChannelPrice" USING btree ("productId", "channelId");


--
-- Name: ChannelPrice_productId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "ChannelPrice_productId_idx" ON public."ChannelPrice" USING btree ("productId");


--
-- Name: Company_code_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Company_code_idx" ON public."Company" USING btree (code);


--
-- Name: Company_code_key; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE UNIQUE INDEX "Company_code_key" ON public."Company" USING btree (code);


--
-- Name: Customer_code_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Customer_code_idx" ON public."Customer" USING btree (code);


--
-- Name: Customer_code_key; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE UNIQUE INDEX "Customer_code_key" ON public."Customer" USING btree (code);


--
-- Name: Customer_companyId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Customer_companyId_idx" ON public."Customer" USING btree ("companyId");


--
-- Name: Inventory_bestBeforeDate_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Inventory_bestBeforeDate_idx" ON public."Inventory" USING btree ("bestBeforeDate");


--
-- Name: Inventory_locationId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Inventory_locationId_idx" ON public."Inventory" USING btree ("locationId");


--
-- Name: Inventory_lotNumber_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Inventory_lotNumber_idx" ON public."Inventory" USING btree ("lotNumber");


--
-- Name: Inventory_productId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Inventory_productId_idx" ON public."Inventory" USING btree ("productId");


--
-- Name: Inventory_productId_warehouseId_locationId_lotNumber_key; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE UNIQUE INDEX "Inventory_productId_warehouseId_locationId_lotNumber_key" ON public."Inventory" USING btree ("productId", "warehouseId", "locationId", "lotNumber");


--
-- Name: Inventory_warehouseId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Inventory_warehouseId_idx" ON public."Inventory" USING btree ("warehouseId");


--
-- Name: Location_warehouseId_code_key; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE UNIQUE INDEX "Location_warehouseId_code_key" ON public."Location" USING btree ("warehouseId", code);


--
-- Name: Location_warehouseId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Location_warehouseId_idx" ON public."Location" USING btree ("warehouseId");


--
-- Name: Location_zoneId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Location_zoneId_idx" ON public."Location" USING btree ("zoneId");


--
-- Name: PickItem_locationId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "PickItem_locationId_idx" ON public."PickItem" USING btree ("locationId");


--
-- Name: PickItem_pickListId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "PickItem_pickListId_idx" ON public."PickItem" USING btree ("pickListId");


--
-- Name: PickItem_productId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "PickItem_productId_idx" ON public."PickItem" USING btree ("productId");


--
-- Name: PickList_assignedUserId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "PickList_assignedUserId_idx" ON public."PickList" USING btree ("assignedUserId");


--
-- Name: PickList_orderId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "PickList_orderId_idx" ON public."PickList" USING btree ("orderId");


--
-- Name: PickList_pickListNumber_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "PickList_pickListNumber_idx" ON public."PickList" USING btree ("pickListNumber");


--
-- Name: PickList_pickListNumber_key; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE UNIQUE INDEX "PickList_pickListNumber_key" ON public."PickList" USING btree ("pickListNumber");


--
-- Name: PickList_status_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "PickList_status_idx" ON public."PickList" USING btree (status);


--
-- Name: Product_brandId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Product_brandId_idx" ON public."Product" USING btree ("brandId");


--
-- Name: Product_companyId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Product_companyId_idx" ON public."Product" USING btree ("companyId");


--
-- Name: Product_sku_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Product_sku_idx" ON public."Product" USING btree (sku);


--
-- Name: Product_sku_key; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE UNIQUE INDEX "Product_sku_key" ON public."Product" USING btree (sku);


--
-- Name: Product_status_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Product_status_idx" ON public."Product" USING btree (status);


--
-- Name: Product_type_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Product_type_idx" ON public."Product" USING btree (type);


--
-- Name: ReplenishmentConfig_productId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "ReplenishmentConfig_productId_idx" ON public."ReplenishmentConfig" USING btree ("productId");


--
-- Name: ReplenishmentConfig_productId_key; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE UNIQUE INDEX "ReplenishmentConfig_productId_key" ON public."ReplenishmentConfig" USING btree ("productId");


--
-- Name: ReplenishmentTask_productId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "ReplenishmentTask_productId_idx" ON public."ReplenishmentTask" USING btree ("productId");


--
-- Name: ReplenishmentTask_status_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "ReplenishmentTask_status_idx" ON public."ReplenishmentTask" USING btree (status);


--
-- Name: ReplenishmentTask_taskNumber_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "ReplenishmentTask_taskNumber_idx" ON public."ReplenishmentTask" USING btree ("taskNumber");


--
-- Name: ReplenishmentTask_taskNumber_key; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE UNIQUE INDEX "ReplenishmentTask_taskNumber_key" ON public."ReplenishmentTask" USING btree ("taskNumber");


--
-- Name: SalesChannel_code_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "SalesChannel_code_idx" ON public."SalesChannel" USING btree (code);


--
-- Name: SalesChannel_code_key; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE UNIQUE INDEX "SalesChannel_code_key" ON public."SalesChannel" USING btree (code);


--
-- Name: SalesChannel_type_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "SalesChannel_type_idx" ON public."SalesChannel" USING btree (type);


--
-- Name: SalesOrderItem_orderId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "SalesOrderItem_orderId_idx" ON public."SalesOrderItem" USING btree ("orderId");


--
-- Name: SalesOrderItem_productId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "SalesOrderItem_productId_idx" ON public."SalesOrderItem" USING btree ("productId");


--
-- Name: SalesOrder_customerId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "SalesOrder_customerId_idx" ON public."SalesOrder" USING btree ("customerId");


--
-- Name: SalesOrder_isWholesale_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "SalesOrder_isWholesale_idx" ON public."SalesOrder" USING btree ("isWholesale");


--
-- Name: SalesOrder_orderNumber_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "SalesOrder_orderNumber_idx" ON public."SalesOrder" USING btree ("orderNumber");


--
-- Name: SalesOrder_orderNumber_key; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE UNIQUE INDEX "SalesOrder_orderNumber_key" ON public."SalesOrder" USING btree ("orderNumber");


--
-- Name: SalesOrder_salesChannel_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "SalesOrder_salesChannel_idx" ON public."SalesOrder" USING btree ("salesChannel");


--
-- Name: SalesOrder_status_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "SalesOrder_status_idx" ON public."SalesOrder" USING btree (status);


--
-- Name: Supplier_code_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Supplier_code_idx" ON public."Supplier" USING btree (code);


--
-- Name: Supplier_code_key; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE UNIQUE INDEX "Supplier_code_key" ON public."Supplier" USING btree (code);


--
-- Name: Supplier_companyId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Supplier_companyId_idx" ON public."Supplier" USING btree ("companyId");


--
-- Name: TransferItem_productId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "TransferItem_productId_idx" ON public."TransferItem" USING btree ("productId");


--
-- Name: TransferItem_transferId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "TransferItem_transferId_idx" ON public."TransferItem" USING btree ("transferId");


--
-- Name: Transfer_fromWarehouseId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Transfer_fromWarehouseId_idx" ON public."Transfer" USING btree ("fromWarehouseId");


--
-- Name: Transfer_status_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Transfer_status_idx" ON public."Transfer" USING btree (status);


--
-- Name: Transfer_toWarehouseId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Transfer_toWarehouseId_idx" ON public."Transfer" USING btree ("toWarehouseId");


--
-- Name: Transfer_transferNumber_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Transfer_transferNumber_idx" ON public."Transfer" USING btree ("transferNumber");


--
-- Name: Transfer_transferNumber_key; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE UNIQUE INDEX "Transfer_transferNumber_key" ON public."Transfer" USING btree ("transferNumber");


--
-- Name: Transfer_type_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Transfer_type_idx" ON public."Transfer" USING btree (type);


--
-- Name: User_companyId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "User_companyId_idx" ON public."User" USING btree ("companyId");


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Warehouse_code_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Warehouse_code_idx" ON public."Warehouse" USING btree (code);


--
-- Name: Warehouse_code_key; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE UNIQUE INDEX "Warehouse_code_key" ON public."Warehouse" USING btree (code);


--
-- Name: Warehouse_companyId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Warehouse_companyId_idx" ON public."Warehouse" USING btree ("companyId");


--
-- Name: Warehouse_type_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Warehouse_type_idx" ON public."Warehouse" USING btree (type);


--
-- Name: Zone_warehouseId_code_key; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE UNIQUE INDEX "Zone_warehouseId_code_key" ON public."Zone" USING btree ("warehouseId", code);


--
-- Name: Zone_warehouseId_idx; Type: INDEX; Schema: public; Owner: wms_user
--

CREATE INDEX "Zone_warehouseId_idx" ON public."Zone" USING btree ("warehouseId");


--
-- Name: hdb_cron_event_invocation_logs hdb_cron_event_invocation_logs_event_id_fkey; Type: FK CONSTRAINT; Schema: hdb_catalog; Owner: wms_user
--

ALTER TABLE ONLY hdb_catalog.hdb_cron_event_invocation_logs
    ADD CONSTRAINT hdb_cron_event_invocation_logs_event_id_fkey FOREIGN KEY (event_id) REFERENCES hdb_catalog.hdb_cron_events(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: hdb_scheduled_event_invocation_logs hdb_scheduled_event_invocation_logs_event_id_fkey; Type: FK CONSTRAINT; Schema: hdb_catalog; Owner: wms_user
--

ALTER TABLE ONLY hdb_catalog.hdb_scheduled_event_invocation_logs
    ADD CONSTRAINT hdb_scheduled_event_invocation_logs_event_id_fkey FOREIGN KEY (event_id) REFERENCES hdb_catalog.hdb_scheduled_events(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Brand Brand_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."Brand"
    ADD CONSTRAINT "Brand_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BundleItem BundleItem_childId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."BundleItem"
    ADD CONSTRAINT "BundleItem_childId_fkey" FOREIGN KEY ("childId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BundleItem BundleItem_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."BundleItem"
    ADD CONSTRAINT "BundleItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChannelPrice ChannelPrice_channelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."ChannelPrice"
    ADD CONSTRAINT "ChannelPrice_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES public."SalesChannel"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChannelPrice ChannelPrice_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."ChannelPrice"
    ADD CONSTRAINT "ChannelPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Customer Customer_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Inventory Inventory_locationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."Inventory"
    ADD CONSTRAINT "Inventory_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES public."Location"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Inventory Inventory_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."Inventory"
    ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Inventory Inventory_warehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."Inventory"
    ADD CONSTRAINT "Inventory_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES public."Warehouse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Location Location_warehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."Location"
    ADD CONSTRAINT "Location_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES public."Warehouse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Location Location_zoneId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."Location"
    ADD CONSTRAINT "Location_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES public."Zone"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PickItem PickItem_locationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."PickItem"
    ADD CONSTRAINT "PickItem_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES public."Location"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PickItem PickItem_pickListId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."PickItem"
    ADD CONSTRAINT "PickItem_pickListId_fkey" FOREIGN KEY ("pickListId") REFERENCES public."PickList"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PickItem PickItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."PickItem"
    ADD CONSTRAINT "PickItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PickList PickList_assignedUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."PickList"
    ADD CONSTRAINT "PickList_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PickList PickList_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."PickList"
    ADD CONSTRAINT "PickList_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."SalesOrder"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Product Product_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Product Product_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ReplenishmentConfig ReplenishmentConfig_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."ReplenishmentConfig"
    ADD CONSTRAINT "ReplenishmentConfig_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReplenishmentTask ReplenishmentTask_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."ReplenishmentTask"
    ADD CONSTRAINT "ReplenishmentTask_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SalesOrderItem SalesOrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."SalesOrderItem"
    ADD CONSTRAINT "SalesOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."SalesOrder"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SalesOrderItem SalesOrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."SalesOrderItem"
    ADD CONSTRAINT "SalesOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SalesOrder SalesOrder_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."SalesOrder"
    ADD CONSTRAINT "SalesOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Supplier Supplier_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."Supplier"
    ADD CONSTRAINT "Supplier_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TransferItem TransferItem_transferId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."TransferItem"
    ADD CONSTRAINT "TransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES public."Transfer"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Transfer Transfer_fromWarehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."Transfer"
    ADD CONSTRAINT "Transfer_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES public."Warehouse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Transfer Transfer_toWarehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."Transfer"
    ADD CONSTRAINT "Transfer_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES public."Warehouse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Warehouse Warehouse_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."Warehouse"
    ADD CONSTRAINT "Warehouse_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Zone Zone_warehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public."Zone"
    ADD CONSTRAINT "Zone_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES public."Warehouse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: directus_access directus_access_policy_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_access
    ADD CONSTRAINT directus_access_policy_foreign FOREIGN KEY (policy) REFERENCES public.directus_policies(id) ON DELETE CASCADE;


--
-- Name: directus_access directus_access_role_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_access
    ADD CONSTRAINT directus_access_role_foreign FOREIGN KEY (role) REFERENCES public.directus_roles(id) ON DELETE CASCADE;


--
-- Name: directus_access directus_access_user_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_access
    ADD CONSTRAINT directus_access_user_foreign FOREIGN KEY ("user") REFERENCES public.directus_users(id) ON DELETE CASCADE;


--
-- Name: directus_collections directus_collections_group_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_collections
    ADD CONSTRAINT directus_collections_group_foreign FOREIGN KEY ("group") REFERENCES public.directus_collections(collection);


--
-- Name: directus_comments directus_comments_user_created_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_comments
    ADD CONSTRAINT directus_comments_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id) ON DELETE SET NULL;


--
-- Name: directus_comments directus_comments_user_updated_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_comments
    ADD CONSTRAINT directus_comments_user_updated_foreign FOREIGN KEY (user_updated) REFERENCES public.directus_users(id);


--
-- Name: directus_dashboards directus_dashboards_user_created_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_dashboards
    ADD CONSTRAINT directus_dashboards_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id) ON DELETE SET NULL;


--
-- Name: directus_files directus_files_folder_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_files
    ADD CONSTRAINT directus_files_folder_foreign FOREIGN KEY (folder) REFERENCES public.directus_folders(id) ON DELETE SET NULL;


--
-- Name: directus_files directus_files_modified_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_files
    ADD CONSTRAINT directus_files_modified_by_foreign FOREIGN KEY (modified_by) REFERENCES public.directus_users(id);


--
-- Name: directus_files directus_files_uploaded_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_files
    ADD CONSTRAINT directus_files_uploaded_by_foreign FOREIGN KEY (uploaded_by) REFERENCES public.directus_users(id);


--
-- Name: directus_flows directus_flows_user_created_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_flows
    ADD CONSTRAINT directus_flows_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id) ON DELETE SET NULL;


--
-- Name: directus_folders directus_folders_parent_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_folders
    ADD CONSTRAINT directus_folders_parent_foreign FOREIGN KEY (parent) REFERENCES public.directus_folders(id);


--
-- Name: directus_notifications directus_notifications_recipient_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_notifications
    ADD CONSTRAINT directus_notifications_recipient_foreign FOREIGN KEY (recipient) REFERENCES public.directus_users(id) ON DELETE CASCADE;


--
-- Name: directus_notifications directus_notifications_sender_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_notifications
    ADD CONSTRAINT directus_notifications_sender_foreign FOREIGN KEY (sender) REFERENCES public.directus_users(id);


--
-- Name: directus_operations directus_operations_flow_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_operations
    ADD CONSTRAINT directus_operations_flow_foreign FOREIGN KEY (flow) REFERENCES public.directus_flows(id) ON DELETE CASCADE;


--
-- Name: directus_operations directus_operations_reject_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_operations
    ADD CONSTRAINT directus_operations_reject_foreign FOREIGN KEY (reject) REFERENCES public.directus_operations(id);


--
-- Name: directus_operations directus_operations_resolve_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_operations
    ADD CONSTRAINT directus_operations_resolve_foreign FOREIGN KEY (resolve) REFERENCES public.directus_operations(id);


--
-- Name: directus_operations directus_operations_user_created_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_operations
    ADD CONSTRAINT directus_operations_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id) ON DELETE SET NULL;


--
-- Name: directus_panels directus_panels_dashboard_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_panels
    ADD CONSTRAINT directus_panels_dashboard_foreign FOREIGN KEY (dashboard) REFERENCES public.directus_dashboards(id) ON DELETE CASCADE;


--
-- Name: directus_panels directus_panels_user_created_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_panels
    ADD CONSTRAINT directus_panels_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id) ON DELETE SET NULL;


--
-- Name: directus_permissions directus_permissions_policy_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_permissions
    ADD CONSTRAINT directus_permissions_policy_foreign FOREIGN KEY (policy) REFERENCES public.directus_policies(id) ON DELETE CASCADE;


--
-- Name: directus_presets directus_presets_role_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_presets
    ADD CONSTRAINT directus_presets_role_foreign FOREIGN KEY (role) REFERENCES public.directus_roles(id) ON DELETE CASCADE;


--
-- Name: directus_presets directus_presets_user_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_presets
    ADD CONSTRAINT directus_presets_user_foreign FOREIGN KEY ("user") REFERENCES public.directus_users(id) ON DELETE CASCADE;


--
-- Name: directus_revisions directus_revisions_activity_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_revisions
    ADD CONSTRAINT directus_revisions_activity_foreign FOREIGN KEY (activity) REFERENCES public.directus_activity(id) ON DELETE CASCADE;


--
-- Name: directus_revisions directus_revisions_parent_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_revisions
    ADD CONSTRAINT directus_revisions_parent_foreign FOREIGN KEY (parent) REFERENCES public.directus_revisions(id);


--
-- Name: directus_revisions directus_revisions_version_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_revisions
    ADD CONSTRAINT directus_revisions_version_foreign FOREIGN KEY (version) REFERENCES public.directus_versions(id) ON DELETE CASCADE;


--
-- Name: directus_roles directus_roles_parent_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_roles
    ADD CONSTRAINT directus_roles_parent_foreign FOREIGN KEY (parent) REFERENCES public.directus_roles(id);


--
-- Name: directus_sessions directus_sessions_share_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_sessions
    ADD CONSTRAINT directus_sessions_share_foreign FOREIGN KEY (share) REFERENCES public.directus_shares(id) ON DELETE CASCADE;


--
-- Name: directus_sessions directus_sessions_user_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_sessions
    ADD CONSTRAINT directus_sessions_user_foreign FOREIGN KEY ("user") REFERENCES public.directus_users(id) ON DELETE CASCADE;


--
-- Name: directus_settings directus_settings_project_logo_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_settings
    ADD CONSTRAINT directus_settings_project_logo_foreign FOREIGN KEY (project_logo) REFERENCES public.directus_files(id);


--
-- Name: directus_settings directus_settings_public_background_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_settings
    ADD CONSTRAINT directus_settings_public_background_foreign FOREIGN KEY (public_background) REFERENCES public.directus_files(id);


--
-- Name: directus_settings directus_settings_public_favicon_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_settings
    ADD CONSTRAINT directus_settings_public_favicon_foreign FOREIGN KEY (public_favicon) REFERENCES public.directus_files(id);


--
-- Name: directus_settings directus_settings_public_foreground_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_settings
    ADD CONSTRAINT directus_settings_public_foreground_foreign FOREIGN KEY (public_foreground) REFERENCES public.directus_files(id);


--
-- Name: directus_settings directus_settings_public_registration_role_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_settings
    ADD CONSTRAINT directus_settings_public_registration_role_foreign FOREIGN KEY (public_registration_role) REFERENCES public.directus_roles(id) ON DELETE SET NULL;


--
-- Name: directus_settings directus_settings_storage_default_folder_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_settings
    ADD CONSTRAINT directus_settings_storage_default_folder_foreign FOREIGN KEY (storage_default_folder) REFERENCES public.directus_folders(id) ON DELETE SET NULL;


--
-- Name: directus_shares directus_shares_collection_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_shares
    ADD CONSTRAINT directus_shares_collection_foreign FOREIGN KEY (collection) REFERENCES public.directus_collections(collection) ON DELETE CASCADE;


--
-- Name: directus_shares directus_shares_role_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_shares
    ADD CONSTRAINT directus_shares_role_foreign FOREIGN KEY (role) REFERENCES public.directus_roles(id) ON DELETE CASCADE;


--
-- Name: directus_shares directus_shares_user_created_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_shares
    ADD CONSTRAINT directus_shares_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id) ON DELETE SET NULL;


--
-- Name: directus_users directus_users_role_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_users
    ADD CONSTRAINT directus_users_role_foreign FOREIGN KEY (role) REFERENCES public.directus_roles(id) ON DELETE SET NULL;


--
-- Name: directus_versions directus_versions_collection_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_versions
    ADD CONSTRAINT directus_versions_collection_foreign FOREIGN KEY (collection) REFERENCES public.directus_collections(collection) ON DELETE CASCADE;


--
-- Name: directus_versions directus_versions_user_created_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_versions
    ADD CONSTRAINT directus_versions_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id) ON DELETE SET NULL;


--
-- Name: directus_versions directus_versions_user_updated_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_versions
    ADD CONSTRAINT directus_versions_user_updated_foreign FOREIGN KEY (user_updated) REFERENCES public.directus_users(id);


--
-- Name: directus_webhooks directus_webhooks_migrated_flow_foreign; Type: FK CONSTRAINT; Schema: public; Owner: wms_user
--

ALTER TABLE ONLY public.directus_webhooks
    ADD CONSTRAINT directus_webhooks_migrated_flow_foreign FOREIGN KEY (migrated_flow) REFERENCES public.directus_flows(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict 2y2cbFnvAWF6B9BI1QB5KiJ5avmDEBqmAtz2aIY5wV020xe6yY8eb9S8w5A69XD


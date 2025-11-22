--
-- PostgreSQL database dump
--

\restrict yoPxZ8uX9h6yKLQX93wY8kj881awEvCZC2a06wZw0W3RXdvviaHgCZFt2f5iLLX

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

ALTER TABLE IF EXISTS ONLY public.directus_webhooks DROP CONSTRAINT IF EXISTS directus_webhooks_migrated_flow_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_versions DROP CONSTRAINT IF EXISTS directus_versions_user_updated_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_versions DROP CONSTRAINT IF EXISTS directus_versions_user_created_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_versions DROP CONSTRAINT IF EXISTS directus_versions_collection_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_users DROP CONSTRAINT IF EXISTS directus_users_role_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_shares DROP CONSTRAINT IF EXISTS directus_shares_user_created_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_shares DROP CONSTRAINT IF EXISTS directus_shares_role_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_shares DROP CONSTRAINT IF EXISTS directus_shares_collection_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_settings DROP CONSTRAINT IF EXISTS directus_settings_storage_default_folder_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_settings DROP CONSTRAINT IF EXISTS directus_settings_public_registration_role_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_settings DROP CONSTRAINT IF EXISTS directus_settings_public_foreground_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_settings DROP CONSTRAINT IF EXISTS directus_settings_public_favicon_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_settings DROP CONSTRAINT IF EXISTS directus_settings_public_background_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_settings DROP CONSTRAINT IF EXISTS directus_settings_project_logo_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_sessions DROP CONSTRAINT IF EXISTS directus_sessions_user_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_sessions DROP CONSTRAINT IF EXISTS directus_sessions_share_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_roles DROP CONSTRAINT IF EXISTS directus_roles_parent_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_revisions DROP CONSTRAINT IF EXISTS directus_revisions_version_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_revisions DROP CONSTRAINT IF EXISTS directus_revisions_parent_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_revisions DROP CONSTRAINT IF EXISTS directus_revisions_activity_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_presets DROP CONSTRAINT IF EXISTS directus_presets_user_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_presets DROP CONSTRAINT IF EXISTS directus_presets_role_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_permissions DROP CONSTRAINT IF EXISTS directus_permissions_policy_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_panels DROP CONSTRAINT IF EXISTS directus_panels_user_created_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_panels DROP CONSTRAINT IF EXISTS directus_panels_dashboard_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_operations DROP CONSTRAINT IF EXISTS directus_operations_user_created_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_operations DROP CONSTRAINT IF EXISTS directus_operations_resolve_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_operations DROP CONSTRAINT IF EXISTS directus_operations_reject_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_operations DROP CONSTRAINT IF EXISTS directus_operations_flow_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_notifications DROP CONSTRAINT IF EXISTS directus_notifications_sender_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_notifications DROP CONSTRAINT IF EXISTS directus_notifications_recipient_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_folders DROP CONSTRAINT IF EXISTS directus_folders_parent_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_flows DROP CONSTRAINT IF EXISTS directus_flows_user_created_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_files DROP CONSTRAINT IF EXISTS directus_files_uploaded_by_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_files DROP CONSTRAINT IF EXISTS directus_files_modified_by_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_files DROP CONSTRAINT IF EXISTS directus_files_folder_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_dashboards DROP CONSTRAINT IF EXISTS directus_dashboards_user_created_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_comments DROP CONSTRAINT IF EXISTS directus_comments_user_updated_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_comments DROP CONSTRAINT IF EXISTS directus_comments_user_created_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_collections DROP CONSTRAINT IF EXISTS directus_collections_group_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_access DROP CONSTRAINT IF EXISTS directus_access_user_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_access DROP CONSTRAINT IF EXISTS directus_access_role_foreign;
ALTER TABLE IF EXISTS ONLY public.directus_access DROP CONSTRAINT IF EXISTS directus_access_policy_foreign;
ALTER TABLE IF EXISTS ONLY public."Zone" DROP CONSTRAINT IF EXISTS "Zone_warehouseId_fkey";
ALTER TABLE IF EXISTS ONLY public."Warehouse" DROP CONSTRAINT IF EXISTS "Warehouse_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public."Transfer" DROP CONSTRAINT IF EXISTS "Transfer_toWarehouseId_fkey";
ALTER TABLE IF EXISTS ONLY public."Transfer" DROP CONSTRAINT IF EXISTS "Transfer_fromWarehouseId_fkey";
ALTER TABLE IF EXISTS ONLY public."TransferItem" DROP CONSTRAINT IF EXISTS "TransferItem_transferId_fkey";
ALTER TABLE IF EXISTS ONLY public."Supplier" DROP CONSTRAINT IF EXISTS "Supplier_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public."SalesOrder" DROP CONSTRAINT IF EXISTS "SalesOrder_customerId_fkey";
ALTER TABLE IF EXISTS ONLY public."SalesOrderItem" DROP CONSTRAINT IF EXISTS "SalesOrderItem_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."SalesOrderItem" DROP CONSTRAINT IF EXISTS "SalesOrderItem_orderId_fkey";
ALTER TABLE IF EXISTS ONLY public."ReplenishmentTask" DROP CONSTRAINT IF EXISTS "ReplenishmentTask_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."ReplenishmentConfig" DROP CONSTRAINT IF EXISTS "ReplenishmentConfig_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."Product" DROP CONSTRAINT IF EXISTS "Product_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public."Product" DROP CONSTRAINT IF EXISTS "Product_brandId_fkey";
ALTER TABLE IF EXISTS ONLY public."PickList" DROP CONSTRAINT IF EXISTS "PickList_orderId_fkey";
ALTER TABLE IF EXISTS ONLY public."PickList" DROP CONSTRAINT IF EXISTS "PickList_assignedUserId_fkey";
ALTER TABLE IF EXISTS ONLY public."PickItem" DROP CONSTRAINT IF EXISTS "PickItem_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."PickItem" DROP CONSTRAINT IF EXISTS "PickItem_pickListId_fkey";
ALTER TABLE IF EXISTS ONLY public."PickItem" DROP CONSTRAINT IF EXISTS "PickItem_locationId_fkey";
ALTER TABLE IF EXISTS ONLY public."Location" DROP CONSTRAINT IF EXISTS "Location_zoneId_fkey";
ALTER TABLE IF EXISTS ONLY public."Location" DROP CONSTRAINT IF EXISTS "Location_warehouseId_fkey";
ALTER TABLE IF EXISTS ONLY public."Inventory" DROP CONSTRAINT IF EXISTS "Inventory_warehouseId_fkey";
ALTER TABLE IF EXISTS ONLY public."Inventory" DROP CONSTRAINT IF EXISTS "Inventory_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."Inventory" DROP CONSTRAINT IF EXISTS "Inventory_locationId_fkey";
ALTER TABLE IF EXISTS ONLY public."Customer" DROP CONSTRAINT IF EXISTS "Customer_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public."ChannelPrice" DROP CONSTRAINT IF EXISTS "ChannelPrice_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."ChannelPrice" DROP CONSTRAINT IF EXISTS "ChannelPrice_channelId_fkey";
ALTER TABLE IF EXISTS ONLY public."BundleItem" DROP CONSTRAINT IF EXISTS "BundleItem_parentId_fkey";
ALTER TABLE IF EXISTS ONLY public."BundleItem" DROP CONSTRAINT IF EXISTS "BundleItem_childId_fkey";
ALTER TABLE IF EXISTS ONLY public."Brand" DROP CONSTRAINT IF EXISTS "Brand_companyId_fkey";
ALTER TABLE IF EXISTS ONLY hdb_catalog.hdb_scheduled_event_invocation_logs DROP CONSTRAINT IF EXISTS hdb_scheduled_event_invocation_logs_event_id_fkey;
ALTER TABLE IF EXISTS ONLY hdb_catalog.hdb_cron_event_invocation_logs DROP CONSTRAINT IF EXISTS hdb_cron_event_invocation_logs_event_id_fkey;
DROP INDEX IF EXISTS public."Zone_warehouseId_idx";
DROP INDEX IF EXISTS public."Zone_warehouseId_code_key";
DROP INDEX IF EXISTS public."Warehouse_type_idx";
DROP INDEX IF EXISTS public."Warehouse_companyId_idx";
DROP INDEX IF EXISTS public."Warehouse_code_key";
DROP INDEX IF EXISTS public."Warehouse_code_idx";
DROP INDEX IF EXISTS public."User_email_key";
DROP INDEX IF EXISTS public."User_email_idx";
DROP INDEX IF EXISTS public."User_companyId_idx";
DROP INDEX IF EXISTS public."Transfer_type_idx";
DROP INDEX IF EXISTS public."Transfer_transferNumber_key";
DROP INDEX IF EXISTS public."Transfer_transferNumber_idx";
DROP INDEX IF EXISTS public."Transfer_toWarehouseId_idx";
DROP INDEX IF EXISTS public."Transfer_status_idx";
DROP INDEX IF EXISTS public."Transfer_fromWarehouseId_idx";
DROP INDEX IF EXISTS public."TransferItem_transferId_idx";
DROP INDEX IF EXISTS public."TransferItem_productId_idx";
DROP INDEX IF EXISTS public."Supplier_companyId_idx";
DROP INDEX IF EXISTS public."Supplier_code_key";
DROP INDEX IF EXISTS public."Supplier_code_idx";
DROP INDEX IF EXISTS public."SalesOrder_status_idx";
DROP INDEX IF EXISTS public."SalesOrder_salesChannel_idx";
DROP INDEX IF EXISTS public."SalesOrder_orderNumber_key";
DROP INDEX IF EXISTS public."SalesOrder_orderNumber_idx";
DROP INDEX IF EXISTS public."SalesOrder_isWholesale_idx";
DROP INDEX IF EXISTS public."SalesOrder_customerId_idx";
DROP INDEX IF EXISTS public."SalesOrderItem_productId_idx";
DROP INDEX IF EXISTS public."SalesOrderItem_orderId_idx";
DROP INDEX IF EXISTS public."SalesChannel_type_idx";
DROP INDEX IF EXISTS public."SalesChannel_code_key";
DROP INDEX IF EXISTS public."SalesChannel_code_idx";
DROP INDEX IF EXISTS public."ReplenishmentTask_taskNumber_key";
DROP INDEX IF EXISTS public."ReplenishmentTask_taskNumber_idx";
DROP INDEX IF EXISTS public."ReplenishmentTask_status_idx";
DROP INDEX IF EXISTS public."ReplenishmentTask_productId_idx";
DROP INDEX IF EXISTS public."ReplenishmentConfig_productId_key";
DROP INDEX IF EXISTS public."ReplenishmentConfig_productId_idx";
DROP INDEX IF EXISTS public."Product_type_idx";
DROP INDEX IF EXISTS public."Product_status_idx";
DROP INDEX IF EXISTS public."Product_sku_key";
DROP INDEX IF EXISTS public."Product_sku_idx";
DROP INDEX IF EXISTS public."Product_companyId_idx";
DROP INDEX IF EXISTS public."Product_brandId_idx";
DROP INDEX IF EXISTS public."PickList_status_idx";
DROP INDEX IF EXISTS public."PickList_pickListNumber_key";
DROP INDEX IF EXISTS public."PickList_pickListNumber_idx";
DROP INDEX IF EXISTS public."PickList_orderId_idx";
DROP INDEX IF EXISTS public."PickList_assignedUserId_idx";
DROP INDEX IF EXISTS public."PickItem_productId_idx";
DROP INDEX IF EXISTS public."PickItem_pickListId_idx";
DROP INDEX IF EXISTS public."PickItem_locationId_idx";
DROP INDEX IF EXISTS public."Location_zoneId_idx";
DROP INDEX IF EXISTS public."Location_warehouseId_idx";
DROP INDEX IF EXISTS public."Location_warehouseId_code_key";
DROP INDEX IF EXISTS public."Inventory_warehouseId_idx";
DROP INDEX IF EXISTS public."Inventory_productId_warehouseId_locationId_lotNumber_key";
DROP INDEX IF EXISTS public."Inventory_productId_idx";
DROP INDEX IF EXISTS public."Inventory_lotNumber_idx";
DROP INDEX IF EXISTS public."Inventory_locationId_idx";
DROP INDEX IF EXISTS public."Inventory_bestBeforeDate_idx";
DROP INDEX IF EXISTS public."Customer_companyId_idx";
DROP INDEX IF EXISTS public."Customer_code_key";
DROP INDEX IF EXISTS public."Customer_code_idx";
DROP INDEX IF EXISTS public."Company_code_key";
DROP INDEX IF EXISTS public."Company_code_idx";
DROP INDEX IF EXISTS public."ChannelPrice_productId_idx";
DROP INDEX IF EXISTS public."ChannelPrice_productId_channelId_key";
DROP INDEX IF EXISTS public."ChannelPrice_channelId_idx";
DROP INDEX IF EXISTS public."BundleItem_parentId_idx";
DROP INDEX IF EXISTS public."BundleItem_parentId_childId_key";
DROP INDEX IF EXISTS public."BundleItem_childId_idx";
DROP INDEX IF EXISTS public."Brand_companyId_idx";
DROP INDEX IF EXISTS public."Brand_code_key";
DROP INDEX IF EXISTS public."Brand_code_idx";
DROP INDEX IF EXISTS hdb_catalog.hdb_version_one_row;
DROP INDEX IF EXISTS hdb_catalog.hdb_scheduled_event_status;
DROP INDEX IF EXISTS hdb_catalog.hdb_cron_events_unique_scheduled;
DROP INDEX IF EXISTS hdb_catalog.hdb_cron_event_status;
DROP INDEX IF EXISTS hdb_catalog.hdb_cron_event_invocation_event_id;
ALTER TABLE IF EXISTS ONLY public.directus_webhooks DROP CONSTRAINT IF EXISTS directus_webhooks_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_versions DROP CONSTRAINT IF EXISTS directus_versions_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_users DROP CONSTRAINT IF EXISTS directus_users_token_unique;
ALTER TABLE IF EXISTS ONLY public.directus_users DROP CONSTRAINT IF EXISTS directus_users_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_users DROP CONSTRAINT IF EXISTS directus_users_external_identifier_unique;
ALTER TABLE IF EXISTS ONLY public.directus_users DROP CONSTRAINT IF EXISTS directus_users_email_unique;
ALTER TABLE IF EXISTS ONLY public.directus_translations DROP CONSTRAINT IF EXISTS directus_translations_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_shares DROP CONSTRAINT IF EXISTS directus_shares_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_settings DROP CONSTRAINT IF EXISTS directus_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_sessions DROP CONSTRAINT IF EXISTS directus_sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_roles DROP CONSTRAINT IF EXISTS directus_roles_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_revisions DROP CONSTRAINT IF EXISTS directus_revisions_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_relations DROP CONSTRAINT IF EXISTS directus_relations_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_presets DROP CONSTRAINT IF EXISTS directus_presets_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_policies DROP CONSTRAINT IF EXISTS directus_policies_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_permissions DROP CONSTRAINT IF EXISTS directus_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_panels DROP CONSTRAINT IF EXISTS directus_panels_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_operations DROP CONSTRAINT IF EXISTS directus_operations_resolve_unique;
ALTER TABLE IF EXISTS ONLY public.directus_operations DROP CONSTRAINT IF EXISTS directus_operations_reject_unique;
ALTER TABLE IF EXISTS ONLY public.directus_operations DROP CONSTRAINT IF EXISTS directus_operations_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_notifications DROP CONSTRAINT IF EXISTS directus_notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_migrations DROP CONSTRAINT IF EXISTS directus_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_folders DROP CONSTRAINT IF EXISTS directus_folders_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_flows DROP CONSTRAINT IF EXISTS directus_flows_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_flows DROP CONSTRAINT IF EXISTS directus_flows_operation_unique;
ALTER TABLE IF EXISTS ONLY public.directus_files DROP CONSTRAINT IF EXISTS directus_files_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_fields DROP CONSTRAINT IF EXISTS directus_fields_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_extensions DROP CONSTRAINT IF EXISTS directus_extensions_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_dashboards DROP CONSTRAINT IF EXISTS directus_dashboards_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_comments DROP CONSTRAINT IF EXISTS directus_comments_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_collections DROP CONSTRAINT IF EXISTS directus_collections_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_activity DROP CONSTRAINT IF EXISTS directus_activity_pkey;
ALTER TABLE IF EXISTS ONLY public.directus_access DROP CONSTRAINT IF EXISTS directus_access_pkey;
ALTER TABLE IF EXISTS ONLY public."Zone" DROP CONSTRAINT IF EXISTS "Zone_pkey";
ALTER TABLE IF EXISTS ONLY public."Warehouse" DROP CONSTRAINT IF EXISTS "Warehouse_pkey";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."Transfer" DROP CONSTRAINT IF EXISTS "Transfer_pkey";
ALTER TABLE IF EXISTS ONLY public."TransferItem" DROP CONSTRAINT IF EXISTS "TransferItem_pkey";
ALTER TABLE IF EXISTS ONLY public."Supplier" DROP CONSTRAINT IF EXISTS "Supplier_pkey";
ALTER TABLE IF EXISTS ONLY public."SalesOrder" DROP CONSTRAINT IF EXISTS "SalesOrder_pkey";
ALTER TABLE IF EXISTS ONLY public."SalesOrderItem" DROP CONSTRAINT IF EXISTS "SalesOrderItem_pkey";
ALTER TABLE IF EXISTS ONLY public."SalesChannel" DROP CONSTRAINT IF EXISTS "SalesChannel_pkey";
ALTER TABLE IF EXISTS ONLY public."ReplenishmentTask" DROP CONSTRAINT IF EXISTS "ReplenishmentTask_pkey";
ALTER TABLE IF EXISTS ONLY public."ReplenishmentConfig" DROP CONSTRAINT IF EXISTS "ReplenishmentConfig_pkey";
ALTER TABLE IF EXISTS ONLY public."Product" DROP CONSTRAINT IF EXISTS "Product_pkey";
ALTER TABLE IF EXISTS ONLY public."PickList" DROP CONSTRAINT IF EXISTS "PickList_pkey";
ALTER TABLE IF EXISTS ONLY public."PickItem" DROP CONSTRAINT IF EXISTS "PickItem_pkey";
ALTER TABLE IF EXISTS ONLY public."Location" DROP CONSTRAINT IF EXISTS "Location_pkey";
ALTER TABLE IF EXISTS ONLY public."Inventory" DROP CONSTRAINT IF EXISTS "Inventory_pkey";
ALTER TABLE IF EXISTS ONLY public."Customer" DROP CONSTRAINT IF EXISTS "Customer_pkey";
ALTER TABLE IF EXISTS ONLY public."Company" DROP CONSTRAINT IF EXISTS "Company_pkey";
ALTER TABLE IF EXISTS ONLY public."ChannelPrice" DROP CONSTRAINT IF EXISTS "ChannelPrice_pkey";
ALTER TABLE IF EXISTS ONLY public."BundleItem" DROP CONSTRAINT IF EXISTS "BundleItem_pkey";
ALTER TABLE IF EXISTS ONLY public."Brand" DROP CONSTRAINT IF EXISTS "Brand_pkey";
ALTER TABLE IF EXISTS ONLY hdb_catalog.hdb_version DROP CONSTRAINT IF EXISTS hdb_version_pkey;
ALTER TABLE IF EXISTS ONLY hdb_catalog.hdb_schema_notifications DROP CONSTRAINT IF EXISTS hdb_schema_notifications_pkey;
ALTER TABLE IF EXISTS ONLY hdb_catalog.hdb_scheduled_events DROP CONSTRAINT IF EXISTS hdb_scheduled_events_pkey;
ALTER TABLE IF EXISTS ONLY hdb_catalog.hdb_scheduled_event_invocation_logs DROP CONSTRAINT IF EXISTS hdb_scheduled_event_invocation_logs_pkey;
ALTER TABLE IF EXISTS ONLY hdb_catalog.hdb_metadata DROP CONSTRAINT IF EXISTS hdb_metadata_resource_version_key;
ALTER TABLE IF EXISTS ONLY hdb_catalog.hdb_metadata DROP CONSTRAINT IF EXISTS hdb_metadata_pkey;
ALTER TABLE IF EXISTS ONLY hdb_catalog.hdb_cron_events DROP CONSTRAINT IF EXISTS hdb_cron_events_pkey;
ALTER TABLE IF EXISTS ONLY hdb_catalog.hdb_cron_event_invocation_logs DROP CONSTRAINT IF EXISTS hdb_cron_event_invocation_logs_pkey;
ALTER TABLE IF EXISTS ONLY hdb_catalog.hdb_action_log DROP CONSTRAINT IF EXISTS hdb_action_log_pkey;
ALTER TABLE IF EXISTS public.directus_webhooks ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.directus_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.directus_revisions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.directus_relations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.directus_presets ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.directus_permissions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.directus_notifications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.directus_fields ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.directus_activity ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.directus_webhooks_id_seq;
DROP TABLE IF EXISTS public.directus_webhooks;
DROP TABLE IF EXISTS public.directus_versions;
DROP TABLE IF EXISTS public.directus_users;
DROP TABLE IF EXISTS public.directus_translations;
DROP TABLE IF EXISTS public.directus_shares;
DROP SEQUENCE IF EXISTS public.directus_settings_id_seq;
DROP TABLE IF EXISTS public.directus_settings;
DROP TABLE IF EXISTS public.directus_sessions;
DROP TABLE IF EXISTS public.directus_roles;
DROP SEQUENCE IF EXISTS public.directus_revisions_id_seq;
DROP TABLE IF EXISTS public.directus_revisions;
DROP SEQUENCE IF EXISTS public.directus_relations_id_seq;
DROP TABLE IF EXISTS public.directus_relations;
DROP SEQUENCE IF EXISTS public.directus_presets_id_seq;
DROP TABLE IF EXISTS public.directus_presets;
DROP TABLE IF EXISTS public.directus_policies;
DROP SEQUENCE IF EXISTS public.directus_permissions_id_seq;
DROP TABLE IF EXISTS public.directus_permissions;
DROP TABLE IF EXISTS public.directus_panels;
DROP TABLE IF EXISTS public.directus_operations;
DROP SEQUENCE IF EXISTS public.directus_notifications_id_seq;
DROP TABLE IF EXISTS public.directus_notifications;
DROP TABLE IF EXISTS public.directus_migrations;
DROP TABLE IF EXISTS public.directus_folders;
DROP TABLE IF EXISTS public.directus_flows;
DROP TABLE IF EXISTS public.directus_files;
DROP SEQUENCE IF EXISTS public.directus_fields_id_seq;
DROP TABLE IF EXISTS public.directus_fields;
DROP TABLE IF EXISTS public.directus_extensions;
DROP TABLE IF EXISTS public.directus_dashboards;
DROP TABLE IF EXISTS public.directus_comments;
DROP TABLE IF EXISTS public.directus_collections;
DROP SEQUENCE IF EXISTS public.directus_activity_id_seq;
DROP TABLE IF EXISTS public.directus_activity;
DROP TABLE IF EXISTS public.directus_access;
DROP TABLE IF EXISTS public."Zone";
DROP TABLE IF EXISTS public."Warehouse";
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."TransferItem";
DROP TABLE IF EXISTS public."Transfer";
DROP TABLE IF EXISTS public."Supplier";
DROP TABLE IF EXISTS public."SalesOrderItem";
DROP TABLE IF EXISTS public."SalesOrder";
DROP TABLE IF EXISTS public."SalesChannel";
DROP TABLE IF EXISTS public."ReplenishmentTask";
DROP TABLE IF EXISTS public."ReplenishmentConfig";
DROP TABLE IF EXISTS public."Product";
DROP TABLE IF EXISTS public."PickList";
DROP TABLE IF EXISTS public."PickItem";
DROP TABLE IF EXISTS public."Location";
DROP TABLE IF EXISTS public."Inventory";
DROP TABLE IF EXISTS public."Customer";
DROP TABLE IF EXISTS public."Company";
DROP TABLE IF EXISTS public."ChannelPrice";
DROP TABLE IF EXISTS public."BundleItem";
DROP TABLE IF EXISTS public."Brand";
DROP TABLE IF EXISTS hdb_catalog.hdb_version;
DROP TABLE IF EXISTS hdb_catalog.hdb_schema_notifications;
DROP TABLE IF EXISTS hdb_catalog.hdb_scheduled_events;
DROP TABLE IF EXISTS hdb_catalog.hdb_scheduled_event_invocation_logs;
DROP TABLE IF EXISTS hdb_catalog.hdb_metadata;
DROP TABLE IF EXISTS hdb_catalog.hdb_cron_events;
DROP TABLE IF EXISTS hdb_catalog.hdb_cron_event_invocation_logs;
DROP TABLE IF EXISTS hdb_catalog.hdb_action_log;
DROP FUNCTION IF EXISTS hdb_catalog.gen_hasura_uuid();
DROP TYPE IF EXISTS public."ZoneType";
DROP TYPE IF EXISTS public."WarehouseType";
DROP TYPE IF EXISTS public."WarehouseStatus";
DROP TYPE IF EXISTS public."TransferType";
DROP TYPE IF EXISTS public."TransferStatus";
DROP TYPE IF EXISTS public."Role";
DROP TYPE IF EXISTS public."ReplenTaskStatus";
DROP TYPE IF EXISTS public."ProductType";
DROP TYPE IF EXISTS public."ProductStatus";
DROP TYPE IF EXISTS public."PickListType";
DROP TYPE IF EXISTS public."PickListStatus";
DROP TYPE IF EXISTS public."PickItemStatus";
DROP TYPE IF EXISTS public."OrderStatus";
DROP TYPE IF EXISTS public."OrderPriority";
DROP TYPE IF EXISTS public."InventoryStatus";
DROP TYPE IF EXISTS public."CustomerType";
DROP TYPE IF EXISTS public."ChannelType";
DROP EXTENSION IF EXISTS pgcrypto;
DROP SCHEMA IF EXISTS hdb_catalog;
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
-- Data for Name: hdb_action_log; Type: TABLE DATA; Schema: hdb_catalog; Owner: wms_user
--

COPY hdb_catalog.hdb_action_log (id, action_name, input_payload, request_headers, session_variables, response_payload, errors, created_at, response_received_at, status) FROM stdin;
\.


--
-- Data for Name: hdb_cron_event_invocation_logs; Type: TABLE DATA; Schema: hdb_catalog; Owner: wms_user
--

COPY hdb_catalog.hdb_cron_event_invocation_logs (id, event_id, status, request, response, created_at) FROM stdin;
\.


--
-- Data for Name: hdb_cron_events; Type: TABLE DATA; Schema: hdb_catalog; Owner: wms_user
--

COPY hdb_catalog.hdb_cron_events (id, trigger_name, scheduled_time, status, tries, created_at, next_retry_at) FROM stdin;
\.


--
-- Data for Name: hdb_metadata; Type: TABLE DATA; Schema: hdb_catalog; Owner: wms_user
--

COPY hdb_catalog.hdb_metadata (id, metadata, resource_version) FROM stdin;
1	{"sources":[{"configuration":{"connection_info":{"database_url":{"from_env":"HASURA_GRAPHQL_DATABASE_URL"},"isolation_level":"read-committed","pool_settings":{"connection_lifetime":600,"idle_timeout":180,"max_connections":50,"retries":1},"use_prepared_statements":true}},"kind":"postgres","name":"default","tables":[{"array_relationships":[{"name":"products","using":{"foreign_key_constraint_on":{"column":"brandId","table":{"name":"Product","schema":"public"}}}}],"table":{"name":"Brand","schema":"public"}},{"table":{"name":"BundleItem","schema":"public"}},{"table":{"name":"ChannelPrice","schema":"public"}},{"table":{"name":"Company","schema":"public"}},{"array_relationships":[{"name":"salesOrders","using":{"foreign_key_constraint_on":{"column":"customerId","table":{"name":"SalesOrder","schema":"public"}}}}],"table":{"name":"Customer","schema":"public"}},{"object_relationships":[{"name":"location","using":{"foreign_key_constraint_on":"locationId"}},{"name":"product","using":{"foreign_key_constraint_on":"productId"}}],"select_permissions":[{"permission":{"columns":"*","filter":{}},"role":"picker"}],"table":{"name":"Inventory","schema":"public"}},{"object_relationships":[{"name":"warehouse","using":{"foreign_key_constraint_on":"warehouseId"}}],"select_permissions":[{"permission":{"columns":"*","filter":{}},"role":"picker"}],"table":{"name":"Location","schema":"public"}},{"select_permissions":[{"permission":{"columns":"*","filter":{}},"role":"packer"},{"permission":{"columns":"*","filter":{}},"role":"picker"}],"table":{"name":"PickItem","schema":"public"}},{"select_permissions":[{"permission":{"columns":"*","filter":{}},"role":"packer"},{"permission":{"columns":"*","filter":{}},"role":"picker"}],"table":{"name":"PickList","schema":"public"}},{"array_relationships":[{"name":"inventoryItems","using":{"foreign_key_constraint_on":{"column":"productId","table":{"name":"Inventory","schema":"public"}}}}],"object_relationships":[{"name":"brand","using":{"foreign_key_constraint_on":"brandId"}}],"select_permissions":[{"permission":{"columns":"*","filter":{}},"role":"packer"},{"permission":{"columns":"*","filter":{}},"role":"picker"}],"table":{"name":"Product","schema":"public"}},{"table":{"name":"ReplenishmentConfig","schema":"public"}},{"table":{"name":"ReplenishmentTask","schema":"public"}},{"table":{"name":"SalesChannel","schema":"public"}},{"array_relationships":[{"name":"salesOrderItems","using":{"foreign_key_constraint_on":{"column":"orderId","table":{"name":"SalesOrderItem","schema":"public"}}}}],"object_relationships":[{"name":"customer","using":{"foreign_key_constraint_on":"customerId"}}],"select_permissions":[{"permission":{"columns":"*","filter":{}},"role":"packer"}],"table":{"name":"SalesOrder","schema":"public"}},{"object_relationships":[{"name":"product","using":{"foreign_key_constraint_on":"productId"}}],"select_permissions":[{"permission":{"columns":"*","filter":{}},"role":"packer"}],"table":{"name":"SalesOrderItem","schema":"public"}},{"table":{"name":"Supplier","schema":"public"}},{"table":{"name":"Transfer","schema":"public"}},{"table":{"name":"TransferItem","schema":"public"}},{"table":{"name":"User","schema":"public"}},{"array_relationships":[{"name":"locations","using":{"foreign_key_constraint_on":{"column":"warehouseId","table":{"name":"Location","schema":"public"}}}}],"select_permissions":[{"permission":{"columns":"*","filter":{}},"role":"picker"}],"table":{"name":"Warehouse","schema":"public"}},{"select_permissions":[{"permission":{"columns":"*","filter":{}},"role":"picker"}],"table":{"name":"Zone","schema":"public"}}]}],"version":3}	36
\.


--
-- Data for Name: hdb_scheduled_event_invocation_logs; Type: TABLE DATA; Schema: hdb_catalog; Owner: wms_user
--

COPY hdb_catalog.hdb_scheduled_event_invocation_logs (id, event_id, status, request, response, created_at) FROM stdin;
\.


--
-- Data for Name: hdb_scheduled_events; Type: TABLE DATA; Schema: hdb_catalog; Owner: wms_user
--

COPY hdb_catalog.hdb_scheduled_events (id, webhook_conf, scheduled_time, retry_conf, payload, header_conf, status, tries, created_at, next_retry_at, comment) FROM stdin;
\.


--
-- Data for Name: hdb_schema_notifications; Type: TABLE DATA; Schema: hdb_catalog; Owner: wms_user
--

COPY hdb_catalog.hdb_schema_notifications (id, notification, resource_version, instance_id, updated_at) FROM stdin;
1	{"metadata":false,"remote_schemas":[],"sources":[],"data_connectors":[]}	36	b437d48f-4ce7-48a5-b710-e0cfab2e0c04	2025-11-22 10:09:55.753361+00
\.


--
-- Data for Name: hdb_version; Type: TABLE DATA; Schema: hdb_catalog; Owner: wms_user
--

COPY hdb_catalog.hdb_version (hasura_uuid, version, upgraded_on, cli_state, console_state, ee_client_id, ee_client_secret) FROM stdin;
1a487be1-16d2-4118-b93b-9cd83b92d3d7	48	2025-11-22 10:02:27.580969+00	{}	{}	\N	\N
\.


--
-- Data for Name: Brand; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public."Brand" (id, name, code, description, "companyId", "createdAt", "updatedAt") FROM stdin;
da5f9b0c-5cf8-4305-b933-cceecf38c2d2	Nakd	NAKD	Nakd healthy snack brand	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	2025-11-19 11:44:07.546	2025-11-19 11:44:07.546
33b36206-dbe7-4732-bd6c-ef27dfc5e18a	Graze	GRAZE	Graze healthy snack brand	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	2025-11-19 11:44:07.55	2025-11-19 11:44:07.55
abf1cb51-935c-4931-9146-a9f541f36771	KIND	KIND	KIND healthy snack brand	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	2025-11-19 11:44:07.552	2025-11-19 11:44:07.552
73ae9ec4-896c-4451-b699-0921c164345d	Nature Valley	NTVLY	Nature Valley healthy snack brand	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	2025-11-19 11:44:07.554	2025-11-19 11:44:07.554
6b476008-18ff-4db3-ae42-a5d6bbf8ca20	Clif Bar	CLIF	Clif Bar healthy snack brand	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	2025-11-19 11:44:07.556	2025-11-19 11:44:07.556
e072d09d-12d5-4582-a28f-63466d5da1e1	RXBAR	RX	RXBAR healthy snack brand	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	2025-11-19 11:44:07.56	2025-11-19 11:44:07.56
5f1c9169-b947-429a-8de2-a9235c3a526c	Quest	QUEST	Quest healthy snack brand	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	2025-11-19 11:44:07.563	2025-11-19 11:44:07.563
7884442b-3d8d-4915-bbac-ecc90f502ab9	LÄRABAR	LARA	LÄRABAR healthy snack brand	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	2025-11-19 11:44:07.565	2025-11-19 11:44:07.565
9ebca3c2-596a-4cf9-9df8-a0730cbf1fae	GoMacro	GMCRO	GoMacro healthy snack brand	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	2025-11-19 11:44:07.567	2025-11-19 11:44:07.567
a6e2ac00-1b8d-4dd4-8006-6f82131168fd	Booja-Booja	BOOJA	Booja-Booja healthy snack brand	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	2025-11-19 11:44:07.569	2025-11-19 11:44:07.569
\.


--
-- Data for Name: BundleItem; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public."BundleItem" (id, "parentId", "childId", quantity, "createdAt") FROM stdin;
6aea1683-6af0-4a79-a202-86e2c90a6ae4	35175ef5-1dad-4ca8-88cb-cf8e49624ec0	c2bf33c2-65da-4800-99d8-f510431025f2	12	2025-11-19 11:44:07.581
b31397fc-a7e2-4070-9076-fff336fdca0a	973f1e3a-1157-43f3-aaf4-d444cf252237	575bb91e-4ae2-4841-931e-fb1667ce544e	12	2025-11-19 11:44:07.591
a40f1999-fae5-4bb9-a0f0-3430dc234dda	3bce830c-79b4-4427-b20f-800cd2220d5e	3f618851-f529-45d2-a466-934713d86aa4	12	2025-11-19 11:44:07.599
e55059d2-c408-4ca9-b655-b2ec6e499b09	21464a1f-3291-4d77-a38a-d6257292b7ef	077c0fc8-95bb-4769-a7d4-c288beb71d7d	12	2025-11-19 11:44:07.607
6bb9e35d-034b-4856-a777-bccb20292190	1916e212-298a-478f-884a-c11bf0119914	7aab4882-2997-44ce-a80c-7bbd50025f8a	12	2025-11-19 11:44:07.615
c2bee3fa-51e9-4601-8da5-d33edb3ea61a	faa7321e-070b-42c1-90d7-560d0fc2c245	d2d60122-eda5-47a0-87de-f909bdf5a386	12	2025-11-19 11:44:07.622
99dc42a5-9056-42f1-9011-8dd737b6f0ff	01af1118-4686-4c68-930a-1e7ca64f0657	55df8fe6-9551-4edf-ad87-21fecdb5b1dd	12	2025-11-19 11:44:07.63
486328db-76b0-41cd-80d0-a81303fa722e	6fb2a109-4577-4382-a36a-f0c7df195a21	d94c04e9-e4bf-444c-87ee-5e7a033915e4	12	2025-11-19 11:44:07.637
2545ccfe-a803-42eb-ba58-9e92ea749a4f	5e2ca2ad-7bf8-4d44-8299-3f6b0ea4c72c	6d6d968b-4df1-4bc4-aaca-989542eaeeea	12	2025-11-19 11:44:07.645
203b59ce-cf03-408f-b05a-0a7d664fcb4e	c9e406df-ccd5-49c1-a8d5-9ef73df75c3e	480aabb0-d869-419d-9669-ca125386399f	12	2025-11-19 11:44:07.652
534ee873-694f-4759-a65c-56bc1d4de1b0	cd2d14a1-3b3a-4979-9051-7df1bd310293	f8382845-039b-4149-88e2-c4c1f33bdea6	12	2025-11-19 11:44:07.659
c3630860-08c3-4c95-8eec-330056daf738	21e4ab4a-681b-4341-b8de-41d4bfa76338	0284163e-aa5a-45b5-8191-803fea0f3551	12	2025-11-19 11:44:07.667
c14fa4c5-3c56-41fe-ac18-e3e562993f5f	d9376524-9808-4971-afe6-925753c7b800	a12fd2f9-6ca0-4763-a1cb-97f5b0541fc6	12	2025-11-19 11:44:07.675
50701aba-354c-47e3-b1cf-40e63d8b075a	a5743087-6dc2-4be2-86a1-b3111215d82f	354b59a9-cb3d-4032-bd62-001178924e1a	12	2025-11-19 11:44:07.683
4a01ad99-e05f-4ba2-ae17-14426ec5197e	588729d7-1295-4b24-a66e-fada023b0b51	3e3ec351-573e-4b14-9e18-19c723f5e4de	12	2025-11-19 11:44:07.69
06f96f61-be94-42ce-b100-5e732011f754	c7a1f76d-517a-4dfd-95db-200a7e767ac8	f01b22a2-de44-431e-9b12-9ad4bfd0c801	12	2025-11-19 11:44:07.698
\.


--
-- Data for Name: ChannelPrice; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public."ChannelPrice" (id, "productId", "channelId", "sellingPrice", "productCost", "laborCost", "materialCost", "shippingCost", "totalCost", "grossProfit", "profitMargin", "isActive", "createdAt", "updatedAt") FROM stdin;
15a5e9d0-8190-4286-b44a-0b7ef0e0cfc8	c2bf33c2-65da-4800-99d8-f510431025f2	1e483ee9-fb0c-46ce-984c-8c263b4021a6	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.859	2025-11-19 11:44:07.859
6fc5539b-b6a0-4bcf-93b6-84017e0176b7	c2bf33c2-65da-4800-99d8-f510431025f2	a2ebc16e-2fbe-4e0d-9514-2e132500b889	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.863	2025-11-19 11:44:07.863
4356182b-cde6-4152-90ee-e5e3e278052e	c2bf33c2-65da-4800-99d8-f510431025f2	1c3087fe-e713-4a7a-8eac-65cbb26dbf50	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.866	2025-11-19 11:44:07.866
03675243-e53c-4230-af0b-a6817437bea5	c2bf33c2-65da-4800-99d8-f510431025f2	496f3313-c9aa-4873-b2fe-64aefeb85b66	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.868	2025-11-19 11:44:07.868
3178e64e-8d8e-4576-ad12-447269a023ad	c2bf33c2-65da-4800-99d8-f510431025f2	8346d447-3972-4fe7-a6d7-14db88c4993d	1.2	0.75	0.1	0.05	0.5	0.9	0.2999999999999999	24.99999999999999	t	2025-11-19 11:44:07.871	2025-11-19 11:44:07.871
bd7b0956-8553-4fd8-9e5a-300174666e0d	575bb91e-4ae2-4841-931e-fb1667ce544e	1e483ee9-fb0c-46ce-984c-8c263b4021a6	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.873	2025-11-19 11:44:07.873
f4dbdf45-6fd2-43b7-8993-53030ec0aa4d	575bb91e-4ae2-4841-931e-fb1667ce544e	a2ebc16e-2fbe-4e0d-9514-2e132500b889	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.876	2025-11-19 11:44:07.876
15eedca3-e52a-4a75-9bd3-213e73e4b60a	575bb91e-4ae2-4841-931e-fb1667ce544e	1c3087fe-e713-4a7a-8eac-65cbb26dbf50	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.878	2025-11-19 11:44:07.878
c9ca6445-3f4d-489e-a347-f8f586994654	575bb91e-4ae2-4841-931e-fb1667ce544e	496f3313-c9aa-4873-b2fe-64aefeb85b66	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.88	2025-11-19 11:44:07.88
203e2e6e-86ac-4d54-a560-6effd4cd23a0	575bb91e-4ae2-4841-931e-fb1667ce544e	8346d447-3972-4fe7-a6d7-14db88c4993d	1.2	0.75	0.1	0.05	0.5	0.9	0.2999999999999999	24.99999999999999	t	2025-11-19 11:44:07.882	2025-11-19 11:44:07.882
93561ea7-a369-4b9f-9967-7b3d34d94743	3f618851-f529-45d2-a466-934713d86aa4	1e483ee9-fb0c-46ce-984c-8c263b4021a6	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.884	2025-11-19 11:44:07.884
03f053f8-91f7-4f3f-89de-17182c29927a	3f618851-f529-45d2-a466-934713d86aa4	a2ebc16e-2fbe-4e0d-9514-2e132500b889	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.886	2025-11-19 11:44:07.886
76ae57a5-c289-479b-a859-7104da65c2bb	3f618851-f529-45d2-a466-934713d86aa4	1c3087fe-e713-4a7a-8eac-65cbb26dbf50	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.887	2025-11-19 11:44:07.887
db0bba95-2961-4d13-bb6a-9ac8ad876ead	3f618851-f529-45d2-a466-934713d86aa4	496f3313-c9aa-4873-b2fe-64aefeb85b66	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.889	2025-11-19 11:44:07.889
1159fa8b-0568-486f-a00d-c283e63ba658	3f618851-f529-45d2-a466-934713d86aa4	8346d447-3972-4fe7-a6d7-14db88c4993d	1.2	0.75	0.1	0.05	0.5	0.9	0.2999999999999999	24.99999999999999	t	2025-11-19 11:44:07.891	2025-11-19 11:44:07.891
1d039b31-9117-43e5-a6ea-7f35ab152411	077c0fc8-95bb-4769-a7d4-c288beb71d7d	1e483ee9-fb0c-46ce-984c-8c263b4021a6	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.893	2025-11-19 11:44:07.893
8d8bdea0-bc30-44c9-a781-77f9fad2516f	077c0fc8-95bb-4769-a7d4-c288beb71d7d	a2ebc16e-2fbe-4e0d-9514-2e132500b889	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.895	2025-11-19 11:44:07.895
85e5d480-8740-4bdc-acdf-7de0b30482a1	077c0fc8-95bb-4769-a7d4-c288beb71d7d	1c3087fe-e713-4a7a-8eac-65cbb26dbf50	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.897	2025-11-19 11:44:07.897
02a09dce-a17d-414b-a970-c0313eb71ebb	077c0fc8-95bb-4769-a7d4-c288beb71d7d	496f3313-c9aa-4873-b2fe-64aefeb85b66	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.899	2025-11-19 11:44:07.899
11bf3693-9202-491c-9ec3-78a2d8e4cc7f	077c0fc8-95bb-4769-a7d4-c288beb71d7d	8346d447-3972-4fe7-a6d7-14db88c4993d	1.2	0.75	0.1	0.05	0.5	0.9	0.2999999999999999	24.99999999999999	t	2025-11-19 11:44:07.901	2025-11-19 11:44:07.901
0a38ccf8-3455-41f9-b3fa-7d6c32bd6a9c	7aab4882-2997-44ce-a80c-7bbd50025f8a	1e483ee9-fb0c-46ce-984c-8c263b4021a6	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.903	2025-11-19 11:44:07.903
fae5f459-c7f2-4b13-a913-c29a8b06d0ca	7aab4882-2997-44ce-a80c-7bbd50025f8a	a2ebc16e-2fbe-4e0d-9514-2e132500b889	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.905	2025-11-19 11:44:07.905
86a990d6-c246-4593-9e63-c29331e83945	7aab4882-2997-44ce-a80c-7bbd50025f8a	1c3087fe-e713-4a7a-8eac-65cbb26dbf50	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.908	2025-11-19 11:44:07.908
d408711a-7ec3-4be9-9c54-71760da98e93	7aab4882-2997-44ce-a80c-7bbd50025f8a	496f3313-c9aa-4873-b2fe-64aefeb85b66	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.91	2025-11-19 11:44:07.91
819905f4-8834-4243-9a4d-8bb1912efcf9	7aab4882-2997-44ce-a80c-7bbd50025f8a	8346d447-3972-4fe7-a6d7-14db88c4993d	1.2	0.75	0.1	0.05	0.5	0.9	0.2999999999999999	24.99999999999999	t	2025-11-19 11:44:07.911	2025-11-19 11:44:07.911
971b76f0-3648-4aaa-b8ae-5e95529004c0	d2d60122-eda5-47a0-87de-f909bdf5a386	1e483ee9-fb0c-46ce-984c-8c263b4021a6	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.913	2025-11-19 11:44:07.913
d343b887-a2e4-471f-8133-a19ba05111e8	d2d60122-eda5-47a0-87de-f909bdf5a386	a2ebc16e-2fbe-4e0d-9514-2e132500b889	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.916	2025-11-19 11:44:07.916
c39e67cc-c4f8-483f-b498-fd677433caaa	d2d60122-eda5-47a0-87de-f909bdf5a386	1c3087fe-e713-4a7a-8eac-65cbb26dbf50	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.918	2025-11-19 11:44:07.918
049f62d3-441f-4c17-99ac-9cf1209d5c2e	d2d60122-eda5-47a0-87de-f909bdf5a386	496f3313-c9aa-4873-b2fe-64aefeb85b66	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.92	2025-11-19 11:44:07.92
a531d454-155c-47ba-829d-47d36a53c32f	d2d60122-eda5-47a0-87de-f909bdf5a386	8346d447-3972-4fe7-a6d7-14db88c4993d	1.2	0.75	0.1	0.05	0.5	0.9	0.2999999999999999	24.99999999999999	t	2025-11-19 11:44:07.922	2025-11-19 11:44:07.922
88aabfab-fd36-4df5-8235-a28274038637	55df8fe6-9551-4edf-ad87-21fecdb5b1dd	1e483ee9-fb0c-46ce-984c-8c263b4021a6	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.923	2025-11-19 11:44:07.923
4c8e3739-3239-4573-a59e-b4b234addd58	55df8fe6-9551-4edf-ad87-21fecdb5b1dd	a2ebc16e-2fbe-4e0d-9514-2e132500b889	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.925	2025-11-19 11:44:07.925
d4436d08-307e-4cd3-be69-978aadb76260	55df8fe6-9551-4edf-ad87-21fecdb5b1dd	1c3087fe-e713-4a7a-8eac-65cbb26dbf50	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.927	2025-11-19 11:44:07.927
92e428f7-8b65-4a43-8360-2b1c353468a6	55df8fe6-9551-4edf-ad87-21fecdb5b1dd	496f3313-c9aa-4873-b2fe-64aefeb85b66	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.929	2025-11-19 11:44:07.929
ce0a00bd-90b3-4224-8c35-91778c8efd49	55df8fe6-9551-4edf-ad87-21fecdb5b1dd	8346d447-3972-4fe7-a6d7-14db88c4993d	1.2	0.75	0.1	0.05	0.5	0.9	0.2999999999999999	24.99999999999999	t	2025-11-19 11:44:07.931	2025-11-19 11:44:07.931
a2b5e9ff-6884-4a59-86a8-929239d93c75	d94c04e9-e4bf-444c-87ee-5e7a033915e4	1e483ee9-fb0c-46ce-984c-8c263b4021a6	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.933	2025-11-19 11:44:07.933
6cbf086a-00a1-4715-bfb1-4e01cc4aab24	d94c04e9-e4bf-444c-87ee-5e7a033915e4	a2ebc16e-2fbe-4e0d-9514-2e132500b889	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.936	2025-11-19 11:44:07.936
136ef982-cda8-4cf2-956a-c68ccb5c2ff8	d94c04e9-e4bf-444c-87ee-5e7a033915e4	1c3087fe-e713-4a7a-8eac-65cbb26dbf50	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.938	2025-11-19 11:44:07.938
c82d1f84-49d9-4d3c-a582-2725e1d5a8a5	d94c04e9-e4bf-444c-87ee-5e7a033915e4	496f3313-c9aa-4873-b2fe-64aefeb85b66	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.94	2025-11-19 11:44:07.94
3c689dfc-d6bc-459a-9cc1-2f5bfd68817b	d94c04e9-e4bf-444c-87ee-5e7a033915e4	8346d447-3972-4fe7-a6d7-14db88c4993d	1.2	0.75	0.1	0.05	0.5	0.9	0.2999999999999999	24.99999999999999	t	2025-11-19 11:44:07.942	2025-11-19 11:44:07.942
650a1dea-0f86-442c-b9a2-e09a24129cc8	6d6d968b-4df1-4bc4-aaca-989542eaeeea	1e483ee9-fb0c-46ce-984c-8c263b4021a6	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.944	2025-11-19 11:44:07.944
238761ec-bce6-4851-a6ff-6d634091304d	6d6d968b-4df1-4bc4-aaca-989542eaeeea	a2ebc16e-2fbe-4e0d-9514-2e132500b889	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.946	2025-11-19 11:44:07.946
d32ca8e4-2402-4873-b8f2-9fda2283574d	6d6d968b-4df1-4bc4-aaca-989542eaeeea	1c3087fe-e713-4a7a-8eac-65cbb26dbf50	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.948	2025-11-19 11:44:07.948
d0312d2a-e7f4-48ed-bf6a-576e78dfac4d	6d6d968b-4df1-4bc4-aaca-989542eaeeea	496f3313-c9aa-4873-b2fe-64aefeb85b66	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.95	2025-11-19 11:44:07.95
d49a6b23-fa9f-438f-9525-fcd8612269e6	6d6d968b-4df1-4bc4-aaca-989542eaeeea	8346d447-3972-4fe7-a6d7-14db88c4993d	1.2	0.75	0.1	0.05	0.5	0.9	0.2999999999999999	24.99999999999999	t	2025-11-19 11:44:07.952	2025-11-19 11:44:07.952
2ffa7972-c904-453e-af6c-08948acf4167	480aabb0-d869-419d-9669-ca125386399f	1e483ee9-fb0c-46ce-984c-8c263b4021a6	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.954	2025-11-19 11:44:07.954
11a64bbc-b13e-4909-8091-b6f7224727aa	480aabb0-d869-419d-9669-ca125386399f	a2ebc16e-2fbe-4e0d-9514-2e132500b889	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.956	2025-11-19 11:44:07.956
9ef32c8a-602a-4fe0-bb97-e8009bf571b5	480aabb0-d869-419d-9669-ca125386399f	1c3087fe-e713-4a7a-8eac-65cbb26dbf50	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.958	2025-11-19 11:44:07.958
c3ceea0e-8660-48f8-9ac0-0218d1d26612	480aabb0-d869-419d-9669-ca125386399f	496f3313-c9aa-4873-b2fe-64aefeb85b66	1.5	0.75	0.1	0.05	0.5	0.9	0.6	40	t	2025-11-19 11:44:07.96	2025-11-19 11:44:07.96
98a43eb8-26c9-43b6-acf3-868df3192a3b	480aabb0-d869-419d-9669-ca125386399f	8346d447-3972-4fe7-a6d7-14db88c4993d	1.2	0.75	0.1	0.05	0.5	0.9	0.2999999999999999	24.99999999999999	t	2025-11-19 11:44:07.963	2025-11-19 11:44:07.963
\.


--
-- Data for Name: Company; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public."Company" (id, name, code, description, address, phone, email, "createdAt", "updatedAt") FROM stdin;
53c65d84-4606-4b0a-8aa5-6eda9e50c3df	Kiaan Food Distribution Ltd	KIAAN	Premium food and snack distribution	123 Distribution Lane, London, UK	+44 20 1234 5678	info@kiaan-distribution.com	2025-11-19 11:44:07.346	2025-11-19 11:44:07.346
\.


--
-- Data for Name: Customer; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public."Customer" (id, name, code, email, phone, address, "companyId", "customerType", "createdAt", "updatedAt") FROM stdin;
0ab20f64-d007-4f49-ac33-930403a2372e	Wilson Hauck	CUST-0001	Naomi.Jacobs41@hotmail.com	1-430-639-6191 x0528	8747 S Walnut Street	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	B2C	2025-11-19 11:44:07.967	2025-11-19 11:44:07.967
f61c167e-aa1b-4bbd-89ef-88e7389bff8d	Perry Bartoletti	CUST-0002	Joseph.Bahringer@yahoo.com	1-391-580-8261 x33195	232 Ebert Unions	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	B2C	2025-11-19 11:44:07.97	2025-11-19 11:44:07.97
7175802e-90b1-4040-9bc1-db8014550e7b	Leon Fahey	CUST-0003	Mae.Abshire@gmail.com	448-324-4787 x40779	725 Riverside Avenue	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	B2C	2025-11-19 11:44:07.973	2025-11-19 11:44:07.973
35ed1deb-9390-4155-9a18-d67dfe1e884d	Blake Collins	CUST-0004	Natasha.Mante10@gmail.com	1-427-918-3089	1020 Howe Terrace	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	B2C	2025-11-19 11:44:07.975	2025-11-19 11:44:07.975
ad99213a-1710-4b2d-a9ec-ca19bfda9466	Tasha Stoltenberg	CUST-0005	Gaetano.Tillman40@gmail.com	735-608-6573 x56556	50787 Zieme Falls	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	B2C	2025-11-19 11:44:07.977	2025-11-19 11:44:07.977
fdcae699-bc23-4034-9e0b-a812bb9f3214	Mr. Patrick Hansen	CUST-0006	Juwan32@yahoo.com	449.679.1693 x630	8777 Sally Knoll	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	B2C	2025-11-19 11:44:07.979	2025-11-19 11:44:07.979
7e82aa4d-d470-4ef3-bd37-545fb7be9c71	Sandy Ledner-Schulist	CUST-0007	Araceli_Nader@hotmail.com	334.500.4224	8929 Meadow Drive	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	B2C	2025-11-19 11:44:07.981	2025-11-19 11:44:07.981
bb107b39-edad-4d11-96ea-f697beeb89b4	Clayton Lakin PhD	CUST-0008	Ernestine.Rath78@yahoo.com	500.209.2661	3758 Brandt Cliff	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	B2C	2025-11-19 11:44:07.983	2025-11-19 11:44:07.983
03b68f8a-55fb-4cb9-aec0-c43dc8dca68b	Dr. Patsy Monahan	CUST-0009	Annie.Hauck21@yahoo.com	584.975.2882 x503	3369 Lulu Rue	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	B2C	2025-11-19 11:44:07.986	2025-11-19 11:44:07.986
00c385ff-bfb1-4a55-9c39-15ef9a3d187c	Brad Pouros	CUST-0010	Nina.OConner@hotmail.com	577-890-3941 x9427	26684 Jefferson Avenue	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	B2C	2025-11-19 11:44:07.988	2025-11-19 11:44:07.988
918d8c09-980a-41a4-94bf-1fb53353d226	Heather Koch	CUST-0011	Erica.Kassulke@hotmail.com	788-847-0673 x34392	524 Hellen Overpass	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	B2C	2025-11-19 11:44:07.99	2025-11-19 11:44:07.99
a178c691-9456-4170-a793-cefd319db8ce	Roger Rosenbaum III	CUST-0012	Karlie.Erdman74@gmail.com	(578) 972-5609 x647	31384 O'Conner Estates	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	B2C	2025-11-19 11:44:07.992	2025-11-19 11:44:07.992
1756307b-2631-4390-8781-e7e0a0e7a8b9	Leona Roberts	CUST-0013	Alexys49@hotmail.com	(218) 846-2760	54745 Gutmann Ways	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	B2C	2025-11-19 11:44:07.994	2025-11-19 11:44:07.994
26c4c219-e34d-4d9e-940d-49c070b18ae0	Jennifer O'Keefe	CUST-0014	Easton.Lesch@hotmail.com	1-663-301-3051 x908	5002 Murray Walk	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	B2C	2025-11-19 11:44:07.995	2025-11-19 11:44:07.995
efb1a102-acab-4d13-9c4d-dd26b82127cb	Annette Abshire	CUST-0015	Missouri_Mann4@yahoo.com	1-611-771-2198 x7581	433 The Maltings	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	B2C	2025-11-19 11:44:07.997	2025-11-19 11:44:07.997
5eec9462-1dbd-4573-8aa3-bc641f175775	Earnest Kutch	CUST-0016	Jovany71@gmail.com	1-319-951-9387 x242	75578 Amelie Rest	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	B2C	2025-11-19 11:44:07.999	2025-11-19 11:44:07.999
7932ff74-858e-4b85-9639-b459e1165560	Jared Armstrong	CUST-0017	Maymie.Hane60@yahoo.com	1-284-224-6886 x68336	37839 Welch Corner	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	B2C	2025-11-19 11:44:08.001	2025-11-19 11:44:08.001
3e333fb0-43d4-41d2-83f2-4f107b405299	Della Bashirian	CUST-0018	Nicolette.Cole11@yahoo.com	(213) 689-9806 x926	734 W 8th Street	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	B2C	2025-11-19 11:44:08.003	2025-11-19 11:44:08.003
aa59d558-8f84-4f31-98c5-abc16fa9e51a	Jan Gulgowski DVM	CUST-0019	Rae_Swift@yahoo.com	1-552-251-8159 x75457	555 Jacobs Light	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	B2C	2025-11-19 11:44:08.005	2025-11-19 11:44:08.005
fd4d456f-4511-4508-8635-736131a31a41	Nettie Miller	CUST-0020	Freda.Parker42@gmail.com	215-885-6039 x880	7368 Hoeger Light	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	B2C	2025-11-19 11:44:08.007	2025-11-19 11:44:08.007
88de4fc3-bec0-446a-b957-a17b10c2d1f9	Koepp and Sons	WHSL-0001	Karli.Breitenberg@gmail.com	(933) 487-8033 x20773	63985 W 11th Street	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	B2B	2025-11-19 11:44:08.009	2025-11-19 11:44:08.009
cc2de915-0bef-460e-8a4f-0441d71a8eba	Rogahn, Ruecker and Wolff	WHSL-0002	Chester.White@gmail.com	(325) 340-2563	3571 Gertrude Mall	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	B2B	2025-11-19 11:44:08.011	2025-11-19 11:44:08.011
3f2e20a1-2ad8-4051-88d6-135a503371e7	Upton, Ebert and Gleichner	WHSL-0003	Sonia_Cormier@gmail.com	(496) 593-6183 x1556	4471 Jaden Freeway	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	B2B	2025-11-19 11:44:08.013	2025-11-19 11:44:08.013
ac31544b-8946-4776-9ae1-f7564497ef94	Marvin - Labadie	WHSL-0004	Eldridge18@yahoo.com	234.942.8154	5666 Rogahn Row	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	B2B	2025-11-19 11:44:08.015	2025-11-19 11:44:08.015
2bf6bca6-1dac-4027-91c2-e6b39de97db9	O'Kon - Hand	WHSL-0005	Koby_Willms@gmail.com	1-998-348-6618 x890	7645 Howe Green	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	B2B	2025-11-19 11:44:08.017	2025-11-19 11:44:08.017
\.


--
-- Data for Name: Inventory; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public."Inventory" (id, "productId", "warehouseId", "locationId", "lotNumber", "batchNumber", "serialNumber", "bestBeforeDate", "receivedDate", quantity, "availableQuantity", "reservedQuantity", status, "createdAt", "updatedAt") FROM stdin;
bb3c0202-6be6-45b9-a4cd-70ae2bd930fd	c2bf33c2-65da-4800-99d8-f510431025f2	c483471e-7137-49fb-b871-316842b061fa	98d25169-b34a-4948-ae13-de35a91e005f	LOT-VHBE36	LOT-VHBE36	\N	2026-01-18 11:44:07.699	2025-10-20 11:44:07.699	120	120	0	AVAILABLE	2025-11-19 11:44:07.702	2025-11-19 11:44:07.702
7ff1878a-68bb-430a-86f2-c82226856a45	c2bf33c2-65da-4800-99d8-f510431025f2	c483471e-7137-49fb-b871-316842b061fa	e5a503c0-9961-45c0-a242-3fd9e68688fb	LOT-YPBOJJ	LOT-YPBOJJ	\N	2026-05-18 11:44:07.699	2025-10-20 11:44:07.699	160	160	0	AVAILABLE	2025-11-19 11:44:07.707	2025-11-19 11:44:07.707
7ecce01c-dd15-4bee-90d2-1fdb2ea02818	c2bf33c2-65da-4800-99d8-f510431025f2	c483471e-7137-49fb-b871-316842b061fa	f195082d-dcab-406a-b35b-ebc0234ee57e	LOT-R6IQQF	LOT-R6IQQF	\N	2026-09-15 11:44:07.699	2025-10-20 11:44:07.699	395	395	0	AVAILABLE	2025-11-19 11:44:07.71	2025-11-19 11:44:07.71
93d1aae9-8b4d-4fc7-8a1b-2bf6f92919f8	575bb91e-4ae2-4841-931e-fb1667ce544e	c483471e-7137-49fb-b871-316842b061fa	1ac9db3b-6de9-43b2-aa23-35ccc447292d	LOT-PDU52X	LOT-PDU52X	\N	2026-01-18 11:44:07.699	2025-10-20 11:44:07.699	117	117	0	AVAILABLE	2025-11-19 11:44:07.713	2025-11-19 11:44:07.713
05af866a-c37e-4451-a1fc-16a36aedb4fd	575bb91e-4ae2-4841-931e-fb1667ce544e	c483471e-7137-49fb-b871-316842b061fa	7adf2abf-63fa-4a4f-8285-eec9317dea29	LOT-AJUPVV	LOT-AJUPVV	\N	2026-05-18 11:44:07.699	2025-10-20 11:44:07.699	263	263	0	AVAILABLE	2025-11-19 11:44:07.716	2025-11-19 11:44:07.716
dd9cf7a7-89ab-406b-847e-048c695f42b0	575bb91e-4ae2-4841-931e-fb1667ce544e	c483471e-7137-49fb-b871-316842b061fa	f195082d-dcab-406a-b35b-ebc0234ee57e	LOT-5MTWOV	LOT-5MTWOV	\N	2026-09-15 11:44:07.699	2025-10-20 11:44:07.699	352	352	0	AVAILABLE	2025-11-19 11:44:07.718	2025-11-19 11:44:07.718
09cb9a41-a074-4683-807c-c025437fe419	3f618851-f529-45d2-a466-934713d86aa4	c483471e-7137-49fb-b871-316842b061fa	3bb1cc12-c4b1-4400-bfe9-3c2c09439d1b	LOT-OVGRNB	LOT-OVGRNB	\N	2026-01-18 11:44:07.699	2025-10-20 11:44:07.699	119	119	0	AVAILABLE	2025-11-19 11:44:07.721	2025-11-19 11:44:07.721
b679a7e5-49d5-4917-b43c-519da330d403	3f618851-f529-45d2-a466-934713d86aa4	c483471e-7137-49fb-b871-316842b061fa	92e613d1-fd13-4ae6-a470-16d22dd4a0d1	LOT-BFG98J	LOT-BFG98J	\N	2026-05-18 11:44:07.699	2025-10-20 11:44:07.699	260	260	0	AVAILABLE	2025-11-19 11:44:07.723	2025-11-19 11:44:07.723
5cf9c51b-d599-4e04-8afe-80e0c83cc2c2	3f618851-f529-45d2-a466-934713d86aa4	c483471e-7137-49fb-b871-316842b061fa	cf25c988-320b-4985-ae68-3292414b9146	LOT-DIJSFO	LOT-DIJSFO	\N	2026-09-15 11:44:07.699	2025-10-20 11:44:07.699	350	350	0	AVAILABLE	2025-11-19 11:44:07.725	2025-11-19 11:44:07.725
95bf505f-0754-4fc2-a089-a19493bf7637	077c0fc8-95bb-4769-a7d4-c288beb71d7d	c483471e-7137-49fb-b871-316842b061fa	e5a503c0-9961-45c0-a242-3fd9e68688fb	LOT-HD6SGC	LOT-HD6SGC	\N	2026-01-18 11:44:07.699	2025-10-20 11:44:07.699	129	129	0	AVAILABLE	2025-11-19 11:44:07.728	2025-11-19 11:44:07.728
1879cf6f-505f-4d7e-9e79-38fc7a4ece8b	077c0fc8-95bb-4769-a7d4-c288beb71d7d	c483471e-7137-49fb-b871-316842b061fa	bcb417cd-d079-4d59-babb-be6124e09ef0	LOT-XRKEU9	LOT-XRKEU9	\N	2026-05-18 11:44:07.699	2025-10-20 11:44:07.699	254	254	0	AVAILABLE	2025-11-19 11:44:07.731	2025-11-19 11:44:07.731
7c9434d6-7e97-445d-91ba-3a7f229fba2b	077c0fc8-95bb-4769-a7d4-c288beb71d7d	c483471e-7137-49fb-b871-316842b061fa	7adf2abf-63fa-4a4f-8285-eec9317dea29	LOT-50FAL9	LOT-50FAL9	\N	2026-09-15 11:44:07.699	2025-10-20 11:44:07.699	445	445	0	AVAILABLE	2025-11-19 11:44:07.734	2025-11-19 11:44:07.734
178f657c-6369-45c4-8637-c98ce5deaf6b	7aab4882-2997-44ce-a80c-7bbd50025f8a	c483471e-7137-49fb-b871-316842b061fa	6464d99d-e4e6-493f-8329-7770cad2177f	LOT-NCUXBV	LOT-NCUXBV	\N	2026-01-18 11:44:07.699	2025-10-20 11:44:07.699	109	109	0	AVAILABLE	2025-11-19 11:44:07.736	2025-11-19 11:44:07.736
16b674b7-0212-4ff2-ae55-c35a46328c9a	7aab4882-2997-44ce-a80c-7bbd50025f8a	c483471e-7137-49fb-b871-316842b061fa	f195082d-dcab-406a-b35b-ebc0234ee57e	LOT-4MI8MP	LOT-4MI8MP	\N	2026-05-18 11:44:07.699	2025-10-20 11:44:07.699	147	147	0	AVAILABLE	2025-11-19 11:44:07.739	2025-11-19 11:44:07.739
6208430e-f9a2-44a2-8a2c-b82c2b4a05db	7aab4882-2997-44ce-a80c-7bbd50025f8a	c483471e-7137-49fb-b871-316842b061fa	41644e41-38e3-4b3d-89ff-20a0035b20de	LOT-UV8LVT	LOT-UV8LVT	\N	2026-09-15 11:44:07.699	2025-10-20 11:44:07.699	291	291	0	AVAILABLE	2025-11-19 11:44:07.741	2025-11-19 11:44:07.741
4380ec91-36f8-4850-ad05-d4ea8d9b370f	d2d60122-eda5-47a0-87de-f909bdf5a386	c483471e-7137-49fb-b871-316842b061fa	1c5823ae-e350-4a24-8286-7108860f0149	LOT-5KZW3D	LOT-5KZW3D	\N	2026-01-18 11:44:07.699	2025-10-20 11:44:07.699	92	92	0	AVAILABLE	2025-11-19 11:44:07.744	2025-11-19 11:44:07.744
ae0a2071-02e5-4593-8f6a-a60964bcb47d	d2d60122-eda5-47a0-87de-f909bdf5a386	c483471e-7137-49fb-b871-316842b061fa	1c5823ae-e350-4a24-8286-7108860f0149	LOT-X2LCEC	LOT-X2LCEC	\N	2026-05-18 11:44:07.699	2025-10-20 11:44:07.699	136	136	0	AVAILABLE	2025-11-19 11:44:07.746	2025-11-19 11:44:07.746
f0f27c0f-a29c-4ce4-986d-37076e8b3c44	d2d60122-eda5-47a0-87de-f909bdf5a386	c483471e-7137-49fb-b871-316842b061fa	bcb417cd-d079-4d59-babb-be6124e09ef0	LOT-9NGHOA	LOT-9NGHOA	\N	2026-09-15 11:44:07.699	2025-10-20 11:44:07.699	445	445	0	AVAILABLE	2025-11-19 11:44:07.748	2025-11-19 11:44:07.748
e28dd0d4-c951-4293-993a-da5e057919b8	55df8fe6-9551-4edf-ad87-21fecdb5b1dd	c483471e-7137-49fb-b871-316842b061fa	e5a503c0-9961-45c0-a242-3fd9e68688fb	LOT-IEUADM	LOT-IEUADM	\N	2026-01-18 11:44:07.699	2025-10-20 11:44:07.699	59	59	0	AVAILABLE	2025-11-19 11:44:07.75	2025-11-19 11:44:07.75
55310739-867a-4b85-81b7-1a531c6dce34	55df8fe6-9551-4edf-ad87-21fecdb5b1dd	c483471e-7137-49fb-b871-316842b061fa	5085ebf2-d585-4b8f-9bf8-fe102d6ad9de	LOT-HK6ML9	LOT-HK6ML9	\N	2026-05-18 11:44:07.699	2025-10-20 11:44:07.699	300	300	0	AVAILABLE	2025-11-19 11:44:07.752	2025-11-19 11:44:07.752
c0396b66-6750-4792-a734-9ebe00372a55	55df8fe6-9551-4edf-ad87-21fecdb5b1dd	c483471e-7137-49fb-b871-316842b061fa	aa7ad9c3-928e-4d9a-b9eb-9984a2013a61	LOT-ISSCJH	LOT-ISSCJH	\N	2026-09-15 11:44:07.699	2025-10-20 11:44:07.699	385	385	0	AVAILABLE	2025-11-19 11:44:07.754	2025-11-19 11:44:07.754
dd1f92bb-a455-429d-8bea-0ef02756b73d	d94c04e9-e4bf-444c-87ee-5e7a033915e4	c483471e-7137-49fb-b871-316842b061fa	5085ebf2-d585-4b8f-9bf8-fe102d6ad9de	LOT-IXNVGT	LOT-IXNVGT	\N	2026-01-18 11:44:07.699	2025-10-20 11:44:07.699	119	119	0	AVAILABLE	2025-11-19 11:44:07.757	2025-11-19 11:44:07.757
cc97e76c-dc79-4f3f-9210-f33f2b9d51e8	d94c04e9-e4bf-444c-87ee-5e7a033915e4	c483471e-7137-49fb-b871-316842b061fa	41644e41-38e3-4b3d-89ff-20a0035b20de	LOT-PRYW0P	LOT-PRYW0P	\N	2026-05-18 11:44:07.699	2025-10-20 11:44:07.699	197	197	0	AVAILABLE	2025-11-19 11:44:07.759	2025-11-19 11:44:07.759
eedad10c-bd2a-4354-b976-8d358ac7bbfb	d94c04e9-e4bf-444c-87ee-5e7a033915e4	c483471e-7137-49fb-b871-316842b061fa	7adf2abf-63fa-4a4f-8285-eec9317dea29	LOT-RH8PXW	LOT-RH8PXW	\N	2026-09-15 11:44:07.699	2025-10-20 11:44:07.699	331	331	0	AVAILABLE	2025-11-19 11:44:07.761	2025-11-19 11:44:07.761
9daebf77-2c81-459f-aab0-0eac199c7018	6d6d968b-4df1-4bc4-aaca-989542eaeeea	c483471e-7137-49fb-b871-316842b061fa	1c5823ae-e350-4a24-8286-7108860f0149	LOT-GN53NM	LOT-GN53NM	\N	2026-01-18 11:44:07.699	2025-10-20 11:44:07.699	93	93	0	AVAILABLE	2025-11-19 11:44:07.763	2025-11-19 11:44:07.763
8519a864-e9f7-4a29-aad2-c6ecae7746d9	6d6d968b-4df1-4bc4-aaca-989542eaeeea	c483471e-7137-49fb-b871-316842b061fa	7adf2abf-63fa-4a4f-8285-eec9317dea29	LOT-HM8JNG	LOT-HM8JNG	\N	2026-05-18 11:44:07.699	2025-10-20 11:44:07.699	153	153	0	AVAILABLE	2025-11-19 11:44:07.765	2025-11-19 11:44:07.765
75708fd0-b132-4a16-891f-b4e71e6b77b0	6d6d968b-4df1-4bc4-aaca-989542eaeeea	c483471e-7137-49fb-b871-316842b061fa	f195082d-dcab-406a-b35b-ebc0234ee57e	LOT-OKFH1U	LOT-OKFH1U	\N	2026-09-15 11:44:07.699	2025-10-20 11:44:07.699	292	292	0	AVAILABLE	2025-11-19 11:44:07.767	2025-11-19 11:44:07.767
8a4fb8c5-9d11-4a02-bdcb-8e944c76f802	480aabb0-d869-419d-9669-ca125386399f	c483471e-7137-49fb-b871-316842b061fa	1c5823ae-e350-4a24-8286-7108860f0149	LOT-MGRY3B	LOT-MGRY3B	\N	2026-01-18 11:44:07.699	2025-10-20 11:44:07.699	97	97	0	AVAILABLE	2025-11-19 11:44:07.77	2025-11-19 11:44:07.77
16d9f1b3-a909-4263-a6b2-4541c453efe0	480aabb0-d869-419d-9669-ca125386399f	c483471e-7137-49fb-b871-316842b061fa	e5a503c0-9961-45c0-a242-3fd9e68688fb	LOT-EQRCFB	LOT-EQRCFB	\N	2026-05-18 11:44:07.699	2025-10-20 11:44:07.699	181	181	0	AVAILABLE	2025-11-19 11:44:07.772	2025-11-19 11:44:07.772
b0686146-acc1-4a10-b945-9eea5e4efc58	480aabb0-d869-419d-9669-ca125386399f	c483471e-7137-49fb-b871-316842b061fa	3bb1cc12-c4b1-4400-bfe9-3c2c09439d1b	LOT-LFBY2Q	LOT-LFBY2Q	\N	2026-09-15 11:44:07.699	2025-10-20 11:44:07.699	490	490	0	AVAILABLE	2025-11-19 11:44:07.774	2025-11-19 11:44:07.774
83398c9e-0ed9-4caa-b45e-61dd38c8c862	f8382845-039b-4149-88e2-c4c1f33bdea6	c483471e-7137-49fb-b871-316842b061fa	482ffa9f-86bb-45b0-b2fc-e50c8c9aebaf	LOT-RIQLTB	LOT-RIQLTB	\N	2026-01-18 11:44:07.699	2025-10-20 11:44:07.699	59	59	0	AVAILABLE	2025-11-19 11:44:07.776	2025-11-19 11:44:07.776
0ed1ed61-eb0e-439d-9bde-adb36401594c	f8382845-039b-4149-88e2-c4c1f33bdea6	c483471e-7137-49fb-b871-316842b061fa	1ac9db3b-6de9-43b2-aa23-35ccc447292d	LOT-K1WZNU	LOT-K1WZNU	\N	2026-05-18 11:44:07.699	2025-10-20 11:44:07.699	297	297	0	AVAILABLE	2025-11-19 11:44:07.778	2025-11-19 11:44:07.778
b7a2fb5f-d318-419f-a72a-ad2c9988b9dc	f8382845-039b-4149-88e2-c4c1f33bdea6	c483471e-7137-49fb-b871-316842b061fa	7adf2abf-63fa-4a4f-8285-eec9317dea29	LOT-YH5DP0	LOT-YH5DP0	\N	2026-09-15 11:44:07.699	2025-10-20 11:44:07.699	447	447	0	AVAILABLE	2025-11-19 11:44:07.781	2025-11-19 11:44:07.781
585f2d16-5aa9-4a42-b184-78f5b97f74f3	0284163e-aa5a-45b5-8191-803fea0f3551	c483471e-7137-49fb-b871-316842b061fa	593de726-cf31-453e-8aef-9723b7dc431c	LOT-LG8GU9	LOT-LG8GU9	\N	2026-01-18 11:44:07.699	2025-10-20 11:44:07.699	68	68	0	AVAILABLE	2025-11-19 11:44:07.783	2025-11-19 11:44:07.783
b3b0301e-3471-4f0e-8690-195822a6ecae	0284163e-aa5a-45b5-8191-803fea0f3551	c483471e-7137-49fb-b871-316842b061fa	aa7ad9c3-928e-4d9a-b9eb-9984a2013a61	LOT-ZQWE5G	LOT-ZQWE5G	\N	2026-05-18 11:44:07.699	2025-10-20 11:44:07.699	173	173	0	AVAILABLE	2025-11-19 11:44:07.786	2025-11-19 11:44:07.786
eb124d68-c7a5-467a-bf0d-1e59c992b075	0284163e-aa5a-45b5-8191-803fea0f3551	c483471e-7137-49fb-b871-316842b061fa	41644e41-38e3-4b3d-89ff-20a0035b20de	LOT-F1NCQ6	LOT-F1NCQ6	\N	2026-09-15 11:44:07.699	2025-10-20 11:44:07.699	479	479	0	AVAILABLE	2025-11-19 11:44:07.788	2025-11-19 11:44:07.788
c3d94612-bd76-412b-aa00-3f05672b8a47	a12fd2f9-6ca0-4763-a1cb-97f5b0541fc6	c483471e-7137-49fb-b871-316842b061fa	7adf2abf-63fa-4a4f-8285-eec9317dea29	LOT-GPKBOD	LOT-GPKBOD	\N	2026-01-18 11:44:07.699	2025-10-20 11:44:07.699	118	118	0	AVAILABLE	2025-11-19 11:44:07.791	2025-11-19 11:44:07.791
f8482620-d0fb-4946-a40b-b794531b2dc1	a12fd2f9-6ca0-4763-a1cb-97f5b0541fc6	c483471e-7137-49fb-b871-316842b061fa	bcb417cd-d079-4d59-babb-be6124e09ef0	LOT-SGFNCW	LOT-SGFNCW	\N	2026-05-18 11:44:07.699	2025-10-20 11:44:07.699	141	141	0	AVAILABLE	2025-11-19 11:44:07.793	2025-11-19 11:44:07.793
9186e8b7-f5a8-4047-939f-3088a7878efb	a12fd2f9-6ca0-4763-a1cb-97f5b0541fc6	c483471e-7137-49fb-b871-316842b061fa	e5a503c0-9961-45c0-a242-3fd9e68688fb	LOT-B2OKDY	LOT-B2OKDY	\N	2026-09-15 11:44:07.699	2025-10-20 11:44:07.699	311	311	0	AVAILABLE	2025-11-19 11:44:07.796	2025-11-19 11:44:07.796
427fba81-c782-4b20-b733-b5a14dcd8f81	354b59a9-cb3d-4032-bd62-001178924e1a	c483471e-7137-49fb-b871-316842b061fa	7adf2abf-63fa-4a4f-8285-eec9317dea29	LOT-LIFDCG	LOT-LIFDCG	\N	2026-01-18 11:44:07.699	2025-10-20 11:44:07.699	57	57	0	AVAILABLE	2025-11-19 11:44:07.798	2025-11-19 11:44:07.798
2c955275-b427-4fb3-83a0-ea7918914094	354b59a9-cb3d-4032-bd62-001178924e1a	c483471e-7137-49fb-b871-316842b061fa	7adf2abf-63fa-4a4f-8285-eec9317dea29	LOT-EMSTZC	LOT-EMSTZC	\N	2026-05-18 11:44:07.699	2025-10-20 11:44:07.699	255	255	0	AVAILABLE	2025-11-19 11:44:07.8	2025-11-19 11:44:07.8
1bd7aa38-7bb1-41d6-ad82-00908983691b	354b59a9-cb3d-4032-bd62-001178924e1a	c483471e-7137-49fb-b871-316842b061fa	593de726-cf31-453e-8aef-9723b7dc431c	LOT-XWFQYR	LOT-XWFQYR	\N	2026-09-15 11:44:07.699	2025-10-20 11:44:07.699	234	234	0	AVAILABLE	2025-11-19 11:44:07.803	2025-11-19 11:44:07.803
83e99120-d999-49e7-b730-eca9b7ba9708	3e3ec351-573e-4b14-9e18-19c723f5e4de	c483471e-7137-49fb-b871-316842b061fa	5085ebf2-d585-4b8f-9bf8-fe102d6ad9de	LOT-W1MQNO	LOT-W1MQNO	\N	2026-01-18 11:44:07.699	2025-10-20 11:44:07.699	65	65	0	AVAILABLE	2025-11-19 11:44:07.805	2025-11-19 11:44:07.805
b203a642-e42a-45d3-b08c-4d93930b64c8	3e3ec351-573e-4b14-9e18-19c723f5e4de	c483471e-7137-49fb-b871-316842b061fa	365c712f-7863-45bd-a2fc-9ca81e0adae5	LOT-INBYTK	LOT-INBYTK	\N	2026-05-18 11:44:07.699	2025-10-20 11:44:07.699	197	197	0	AVAILABLE	2025-11-19 11:44:07.809	2025-11-19 11:44:07.809
85230562-3ca0-4d67-9c1a-68ae466667fb	3e3ec351-573e-4b14-9e18-19c723f5e4de	c483471e-7137-49fb-b871-316842b061fa	0c2cf619-65d1-429e-a342-fa4a44fae160	LOT-DXPDIJ	LOT-DXPDIJ	\N	2026-09-15 11:44:07.699	2025-10-20 11:44:07.699	268	268	0	AVAILABLE	2025-11-19 11:44:07.813	2025-11-19 11:44:07.813
27896cb4-2fb6-47c4-91ea-7320e32f3ed8	f01b22a2-de44-431e-9b12-9ad4bfd0c801	c483471e-7137-49fb-b871-316842b061fa	cf25c988-320b-4985-ae68-3292414b9146	LOT-P9EBON	LOT-P9EBON	\N	2026-01-18 11:44:07.699	2025-10-20 11:44:07.699	124	124	0	AVAILABLE	2025-11-19 11:44:07.817	2025-11-19 11:44:07.817
6ede0db4-e731-46bc-960d-fc4e0c4da6d2	f01b22a2-de44-431e-9b12-9ad4bfd0c801	c483471e-7137-49fb-b871-316842b061fa	bcb417cd-d079-4d59-babb-be6124e09ef0	LOT-MML1RM	LOT-MML1RM	\N	2026-05-18 11:44:07.699	2025-10-20 11:44:07.699	166	166	0	AVAILABLE	2025-11-19 11:44:07.819	2025-11-19 11:44:07.819
0084d4ef-8f3c-4842-9ad3-38f1e5aad35f	f01b22a2-de44-431e-9b12-9ad4bfd0c801	c483471e-7137-49fb-b871-316842b061fa	aa7ad9c3-928e-4d9a-b9eb-9984a2013a61	LOT-JEMBXW	LOT-JEMBXW	\N	2026-09-15 11:44:07.699	2025-10-20 11:44:07.699	367	367	0	AVAILABLE	2025-11-19 11:44:07.822	2025-11-19 11:44:07.822
\.


--
-- Data for Name: Location; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public."Location" (id, name, code, "warehouseId", "zoneId", aisle, rack, shelf, bin, "createdAt", "updatedAt") FROM stdin;
5085ebf2-d585-4b8f-9bf8-fe102d6ad9de	Location A1	LOC-A1	c483471e-7137-49fb-b871-316842b061fa	7bb35ebd-8244-4d01-a0cd-998acce2c6ba	A	1	1	1	2025-11-19 11:44:07.501	2025-11-19 11:44:07.501
6464d99d-e4e6-493f-8329-7770cad2177f	Location A2	LOC-A2	c483471e-7137-49fb-b871-316842b061fa	7bb35ebd-8244-4d01-a0cd-998acce2c6ba	A	2	1	1	2025-11-19 11:44:07.505	2025-11-19 11:44:07.505
e5a503c0-9961-45c0-a242-3fd9e68688fb	Location A3	LOC-A3	c483471e-7137-49fb-b871-316842b061fa	7bb35ebd-8244-4d01-a0cd-998acce2c6ba	A	3	1	1	2025-11-19 11:44:07.508	2025-11-19 11:44:07.508
7adf2abf-63fa-4a4f-8285-eec9317dea29	Location A4	LOC-A4	c483471e-7137-49fb-b871-316842b061fa	7bb35ebd-8244-4d01-a0cd-998acce2c6ba	A	4	1	1	2025-11-19 11:44:07.51	2025-11-19 11:44:07.51
d4015ba6-3acd-4383-9960-1165b1eac867	Location A5	LOC-A5	c483471e-7137-49fb-b871-316842b061fa	7bb35ebd-8244-4d01-a0cd-998acce2c6ba	A	5	1	1	2025-11-19 11:44:07.512	2025-11-19 11:44:07.512
92e613d1-fd13-4ae6-a470-16d22dd4a0d1	Location B1	LOC-B1	c483471e-7137-49fb-b871-316842b061fa	7bb35ebd-8244-4d01-a0cd-998acce2c6ba	B	1	1	1	2025-11-19 11:44:07.515	2025-11-19 11:44:07.515
cf25c988-320b-4985-ae68-3292414b9146	Location B2	LOC-B2	c483471e-7137-49fb-b871-316842b061fa	7bb35ebd-8244-4d01-a0cd-998acce2c6ba	B	2	1	1	2025-11-19 11:44:07.517	2025-11-19 11:44:07.517
f195082d-dcab-406a-b35b-ebc0234ee57e	Location B3	LOC-B3	c483471e-7137-49fb-b871-316842b061fa	7bb35ebd-8244-4d01-a0cd-998acce2c6ba	B	3	1	1	2025-11-19 11:44:07.52	2025-11-19 11:44:07.52
1ac9db3b-6de9-43b2-aa23-35ccc447292d	Location B4	LOC-B4	c483471e-7137-49fb-b871-316842b061fa	7bb35ebd-8244-4d01-a0cd-998acce2c6ba	B	4	1	1	2025-11-19 11:44:07.522	2025-11-19 11:44:07.522
1c5823ae-e350-4a24-8286-7108860f0149	Location B5	LOC-B5	c483471e-7137-49fb-b871-316842b061fa	7bb35ebd-8244-4d01-a0cd-998acce2c6ba	B	5	1	1	2025-11-19 11:44:07.524	2025-11-19 11:44:07.524
98d25169-b34a-4948-ae13-de35a91e005f	Location C1	LOC-C1	c483471e-7137-49fb-b871-316842b061fa	e7cd632e-3de1-4f52-80b2-c686a56a9682	C	1	1	1	2025-11-19 11:44:07.526	2025-11-19 11:44:07.526
0c2cf619-65d1-429e-a342-fa4a44fae160	Location C2	LOC-C2	c483471e-7137-49fb-b871-316842b061fa	e7cd632e-3de1-4f52-80b2-c686a56a9682	C	2	1	1	2025-11-19 11:44:07.529	2025-11-19 11:44:07.529
41644e41-38e3-4b3d-89ff-20a0035b20de	Location C3	LOC-C3	c483471e-7137-49fb-b871-316842b061fa	e7cd632e-3de1-4f52-80b2-c686a56a9682	C	3	1	1	2025-11-19 11:44:07.531	2025-11-19 11:44:07.531
3bb1cc12-c4b1-4400-bfe9-3c2c09439d1b	Location C4	LOC-C4	c483471e-7137-49fb-b871-316842b061fa	e7cd632e-3de1-4f52-80b2-c686a56a9682	C	4	1	1	2025-11-19 11:44:07.533	2025-11-19 11:44:07.533
bcb417cd-d079-4d59-babb-be6124e09ef0	Location C5	LOC-C5	c483471e-7137-49fb-b871-316842b061fa	e7cd632e-3de1-4f52-80b2-c686a56a9682	C	5	1	1	2025-11-19 11:44:07.535	2025-11-19 11:44:07.535
aba8b295-1646-4c7c-a9a4-72ccddfa10b1	Location D1	LOC-D1	c483471e-7137-49fb-b871-316842b061fa	e7cd632e-3de1-4f52-80b2-c686a56a9682	D	1	1	1	2025-11-19 11:44:07.537	2025-11-19 11:44:07.537
593de726-cf31-453e-8aef-9723b7dc431c	Location D2	LOC-D2	c483471e-7137-49fb-b871-316842b061fa	e7cd632e-3de1-4f52-80b2-c686a56a9682	D	2	1	1	2025-11-19 11:44:07.539	2025-11-19 11:44:07.539
365c712f-7863-45bd-a2fc-9ca81e0adae5	Location D3	LOC-D3	c483471e-7137-49fb-b871-316842b061fa	e7cd632e-3de1-4f52-80b2-c686a56a9682	D	3	1	1	2025-11-19 11:44:07.541	2025-11-19 11:44:07.541
482ffa9f-86bb-45b0-b2fc-e50c8c9aebaf	Location D4	LOC-D4	c483471e-7137-49fb-b871-316842b061fa	e7cd632e-3de1-4f52-80b2-c686a56a9682	D	4	1	1	2025-11-19 11:44:07.542	2025-11-19 11:44:07.542
aa7ad9c3-928e-4d9a-b9eb-9984a2013a61	Location D5	LOC-D5	c483471e-7137-49fb-b871-316842b061fa	e7cd632e-3de1-4f52-80b2-c686a56a9682	D	5	1	1	2025-11-19 11:44:07.544	2025-11-19 11:44:07.544
\.


--
-- Data for Name: PickItem; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public."PickItem" (id, "pickListId", "productId", "locationId", "selectedBBDate", "lotNumber", "quantityRequired", "quantityPicked", status, "sequenceNumber", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PickList; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public."PickList" (id, "pickListNumber", type, "orderId", "assignedUserId", status, priority, "enforceSingleBBDate", "startedAt", "completedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public."Product" (id, sku, name, description, barcode, "companyId", "brandId", type, status, length, width, height, weight, "dimensionUnit", "weightUnit", "costPrice", "sellingPrice", currency, "isPerishable", "requiresBatch", "requiresSerial", "shelfLifeDays", images, "createdAt", "updatedAt") FROM stdin;
c2bf33c2-65da-4800-99d8-f510431025f2	NAKD-001	Nakd Cashew Cookie	Nakd Cashew Cookie Bar - Single Unit	114065306382	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	da5f9b0c-5cf8-4305-b933-cceecf38c2d2	SIMPLE	ACTIVE	15	5	2	0.05	cm	kg	0.75	1.5	GBP	t	t	f	365	{}	2025-11-19 11:44:07.572	2025-11-19 11:44:07.572
35175ef5-1dad-4ca8-88cb-cf8e49624ec0	NAKD-BDL-001	Nakd Cashew Cookie - 12 Pack	Nakd Cashew Cookie Bar - Case of 12	182375866943	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	da5f9b0c-5cf8-4305-b933-cceecf38c2d2	BUNDLE	ACTIVE	30	20	10	0.6	cm	kg	9	15	GBP	t	t	f	365	{}	2025-11-19 11:44:07.577	2025-11-19 11:44:07.577
575bb91e-4ae2-4841-931e-fb1667ce544e	NAKD-002	Nakd Cocoa Delight	Nakd Cocoa Delight Bar - Single Unit	94972750091	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	da5f9b0c-5cf8-4305-b933-cceecf38c2d2	SIMPLE	ACTIVE	15	5	2	0.05	cm	kg	0.75	1.5	GBP	t	t	f	365	{}	2025-11-19 11:44:07.584	2025-11-19 11:44:07.584
973f1e3a-1157-43f3-aaf4-d444cf252237	NAKD-BDL-002	Nakd Cocoa Delight - 12 Pack	Nakd Cocoa Delight Bar - Case of 12	333037065171	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	da5f9b0c-5cf8-4305-b933-cceecf38c2d2	BUNDLE	ACTIVE	30	20	10	0.6	cm	kg	9	15	GBP	t	t	f	365	{}	2025-11-19 11:44:07.588	2025-11-19 11:44:07.588
3f618851-f529-45d2-a466-934713d86aa4	NAKD-003	Nakd Berry Delight	Nakd Berry Delight Bar - Single Unit	337499273692	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	da5f9b0c-5cf8-4305-b933-cceecf38c2d2	SIMPLE	ACTIVE	15	5	2	0.05	cm	kg	0.75	1.5	GBP	t	t	f	365	{}	2025-11-19 11:44:07.593	2025-11-19 11:44:07.593
3bce830c-79b4-4427-b20f-800cd2220d5e	NAKD-BDL-003	Nakd Berry Delight - 12 Pack	Nakd Berry Delight Bar - Case of 12	627665476657	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	da5f9b0c-5cf8-4305-b933-cceecf38c2d2	BUNDLE	ACTIVE	30	20	10	0.6	cm	kg	9	15	GBP	t	t	f	365	{}	2025-11-19 11:44:07.596	2025-11-19 11:44:07.596
077c0fc8-95bb-4769-a7d4-c288beb71d7d	NAKD-004	Nakd Pecan Pie	Nakd Pecan Pie Bar - Single Unit	671451492782	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	da5f9b0c-5cf8-4305-b933-cceecf38c2d2	SIMPLE	ACTIVE	15	5	2	0.05	cm	kg	0.75	1.5	GBP	t	t	f	365	{}	2025-11-19 11:44:07.602	2025-11-19 11:44:07.602
21464a1f-3291-4d77-a38a-d6257292b7ef	NAKD-BDL-004	Nakd Pecan Pie - 12 Pack	Nakd Pecan Pie Bar - Case of 12	863370995181	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	da5f9b0c-5cf8-4305-b933-cceecf38c2d2	BUNDLE	ACTIVE	30	20	10	0.6	cm	kg	9	15	GBP	t	t	f	365	{}	2025-11-19 11:44:07.604	2025-11-19 11:44:07.604
7aab4882-2997-44ce-a80c-7bbd50025f8a	NAKD-005	Nakd Salted Caramel	Nakd Salted Caramel Bar - Single Unit	776825510081	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	da5f9b0c-5cf8-4305-b933-cceecf38c2d2	SIMPLE	ACTIVE	15	5	2	0.05	cm	kg	0.75	1.5	GBP	t	t	f	365	{}	2025-11-19 11:44:07.61	2025-11-19 11:44:07.61
1916e212-298a-478f-884a-c11bf0119914	NAKD-BDL-005	Nakd Salted Caramel - 12 Pack	Nakd Salted Caramel Bar - Case of 12	401362954355	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	da5f9b0c-5cf8-4305-b933-cceecf38c2d2	BUNDLE	ACTIVE	30	20	10	0.6	cm	kg	9	15	GBP	t	t	f	365	{}	2025-11-19 11:44:07.612	2025-11-19 11:44:07.612
d2d60122-eda5-47a0-87de-f909bdf5a386	GRAZE-001	Graze Vanilla Bliss	Graze Vanilla Bliss Bar - Single Unit	900395068750	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	33b36206-dbe7-4732-bd6c-ef27dfc5e18a	SIMPLE	ACTIVE	15	5	2	0.05	cm	kg	0.75	1.5	GBP	t	t	f	365	{}	2025-11-19 11:44:07.617	2025-11-19 11:44:07.617
faa7321e-070b-42c1-90d7-560d0fc2c245	GRAZE-BDL-001	Graze Vanilla Bliss - 12 Pack	Graze Vanilla Bliss Bar - Case of 12	266172023541	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	33b36206-dbe7-4732-bd6c-ef27dfc5e18a	BUNDLE	ACTIVE	30	20	10	0.6	cm	kg	9	15	GBP	t	t	f	365	{}	2025-11-19 11:44:07.62	2025-11-19 11:44:07.62
55df8fe6-9551-4edf-ad87-21fecdb5b1dd	GRAZE-002	Graze Choc Orange	Graze Choc Orange Bar - Single Unit	786428978638	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	33b36206-dbe7-4732-bd6c-ef27dfc5e18a	SIMPLE	ACTIVE	15	5	2	0.05	cm	kg	0.75	1.5	GBP	t	t	f	365	{}	2025-11-19 11:44:07.625	2025-11-19 11:44:07.625
01af1118-4686-4c68-930a-1e7ca64f0657	GRAZE-BDL-002	Graze Choc Orange - 12 Pack	Graze Choc Orange Bar - Case of 12	945303855725	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	33b36206-dbe7-4732-bd6c-ef27dfc5e18a	BUNDLE	ACTIVE	30	20	10	0.6	cm	kg	9	15	GBP	t	t	f	365	{}	2025-11-19 11:44:07.628	2025-11-19 11:44:07.628
d94c04e9-e4bf-444c-87ee-5e7a033915e4	GRAZE-003	Graze Coconut Dream	Graze Coconut Dream Bar - Single Unit	733964265922	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	33b36206-dbe7-4732-bd6c-ef27dfc5e18a	SIMPLE	ACTIVE	15	5	2	0.05	cm	kg	0.75	1.5	GBP	t	t	f	365	{}	2025-11-19 11:44:07.632	2025-11-19 11:44:07.632
6fb2a109-4577-4382-a36a-f0c7df195a21	GRAZE-BDL-003	Graze Coconut Dream - 12 Pack	Graze Coconut Dream Bar - Case of 12	782312215480	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	33b36206-dbe7-4732-bd6c-ef27dfc5e18a	BUNDLE	ACTIVE	30	20	10	0.6	cm	kg	9	15	GBP	t	t	f	365	{}	2025-11-19 11:44:07.635	2025-11-19 11:44:07.635
6d6d968b-4df1-4bc4-aaca-989542eaeeea	GRAZE-004	Graze Apple Crunch	Graze Apple Crunch Bar - Single Unit	70887968651	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	33b36206-dbe7-4732-bd6c-ef27dfc5e18a	SIMPLE	ACTIVE	15	5	2	0.05	cm	kg	0.75	1.5	GBP	t	t	f	365	{}	2025-11-19 11:44:07.64	2025-11-19 11:44:07.64
5e2ca2ad-7bf8-4d44-8299-3f6b0ea4c72c	GRAZE-BDL-004	Graze Apple Crunch - 12 Pack	Graze Apple Crunch Bar - Case of 12	819973474153	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	33b36206-dbe7-4732-bd6c-ef27dfc5e18a	BUNDLE	ACTIVE	30	20	10	0.6	cm	kg	9	15	GBP	t	t	f	365	{}	2025-11-19 11:44:07.642	2025-11-19 11:44:07.642
480aabb0-d869-419d-9669-ca125386399f	KIND-001	KIND Dark Chocolate	KIND Dark Chocolate Bar - Single Unit	936133286178	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	abf1cb51-935c-4931-9146-a9f541f36771	SIMPLE	ACTIVE	15	5	2	0.05	cm	kg	0.75	1.5	GBP	t	t	f	365	{}	2025-11-19 11:44:07.647	2025-11-19 11:44:07.647
c9e406df-ccd5-49c1-a8d5-9ef73df75c3e	KIND-BDL-001	KIND Dark Chocolate - 12 Pack	KIND Dark Chocolate Bar - Case of 12	817266456535	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	abf1cb51-935c-4931-9146-a9f541f36771	BUNDLE	ACTIVE	30	20	10	0.6	cm	kg	9	15	GBP	t	t	f	365	{}	2025-11-19 11:44:07.649	2025-11-19 11:44:07.649
f8382845-039b-4149-88e2-c4c1f33bdea6	KIND-002	KIND Almond & Coconut	KIND Almond & Coconut Bar - Single Unit	970146987015	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	abf1cb51-935c-4931-9146-a9f541f36771	SIMPLE	ACTIVE	15	5	2	0.05	cm	kg	0.75	1.5	GBP	t	t	f	365	{}	2025-11-19 11:44:07.654	2025-11-19 11:44:07.654
cd2d14a1-3b3a-4979-9051-7df1bd310293	KIND-BDL-002	KIND Almond & Coconut - 12 Pack	KIND Almond & Coconut Bar - Case of 12	949844700420	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	abf1cb51-935c-4931-9146-a9f541f36771	BUNDLE	ACTIVE	30	20	10	0.6	cm	kg	9	15	GBP	t	t	f	365	{}	2025-11-19 11:44:07.657	2025-11-19 11:44:07.657
0284163e-aa5a-45b5-8191-803fea0f3551	KIND-003	KIND Peanut Butter	KIND Peanut Butter Bar - Single Unit	63718927670	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	abf1cb51-935c-4931-9146-a9f541f36771	SIMPLE	ACTIVE	15	5	2	0.05	cm	kg	0.75	1.5	GBP	t	t	f	365	{}	2025-11-19 11:44:07.661	2025-11-19 11:44:07.661
21e4ab4a-681b-4341-b8de-41d4bfa76338	KIND-BDL-003	KIND Peanut Butter - 12 Pack	KIND Peanut Butter Bar - Case of 12	114678143634	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	abf1cb51-935c-4931-9146-a9f541f36771	BUNDLE	ACTIVE	30	20	10	0.6	cm	kg	9	15	GBP	t	t	f	365	{}	2025-11-19 11:44:07.663	2025-11-19 11:44:07.663
a12fd2f9-6ca0-4763-a1cb-97f5b0541fc6	KIND-004	KIND Maple Glazed	KIND Maple Glazed Bar - Single Unit	862384655427	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	abf1cb51-935c-4931-9146-a9f541f36771	SIMPLE	ACTIVE	15	5	2	0.05	cm	kg	0.75	1.5	GBP	t	t	f	365	{}	2025-11-19 11:44:07.669	2025-11-19 11:44:07.669
d9376524-9808-4971-afe6-925753c7b800	KIND-BDL-004	KIND Maple Glazed - 12 Pack	KIND Maple Glazed Bar - Case of 12	182412616523	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	abf1cb51-935c-4931-9146-a9f541f36771	BUNDLE	ACTIVE	30	20	10	0.6	cm	kg	9	15	GBP	t	t	f	365	{}	2025-11-19 11:44:07.673	2025-11-19 11:44:07.673
354b59a9-cb3d-4032-bd62-001178924e1a	NTVLY-001	Nature Valley Original	Nature Valley Original Bar - Single Unit	313076094873	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	73ae9ec4-896c-4451-b699-0921c164345d	SIMPLE	ACTIVE	15	5	2	0.05	cm	kg	0.75	1.5	GBP	t	t	f	365	{}	2025-11-19 11:44:07.677	2025-11-19 11:44:07.677
a5743087-6dc2-4be2-86a1-b3111215d82f	NTVLY-BDL-001	Nature Valley Original - 12 Pack	Nature Valley Original Bar - Case of 12	594660985597	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	73ae9ec4-896c-4451-b699-0921c164345d	BUNDLE	ACTIVE	30	20	10	0.6	cm	kg	9	15	GBP	t	t	f	365	{}	2025-11-19 11:44:07.681	2025-11-19 11:44:07.681
3e3ec351-573e-4b14-9e18-19c723f5e4de	NTVLY-002	Nature Valley Classic	Nature Valley Classic Bar - Single Unit	731258445968	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	73ae9ec4-896c-4451-b699-0921c164345d	SIMPLE	ACTIVE	15	5	2	0.05	cm	kg	0.75	1.5	GBP	t	t	f	365	{}	2025-11-19 11:44:07.685	2025-11-19 11:44:07.685
588729d7-1295-4b24-a66e-fada023b0b51	NTVLY-BDL-002	Nature Valley Classic - 12 Pack	Nature Valley Classic Bar - Case of 12	457927147950	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	73ae9ec4-896c-4451-b699-0921c164345d	BUNDLE	ACTIVE	30	20	10	0.6	cm	kg	9	15	GBP	t	t	f	365	{}	2025-11-19 11:44:07.688	2025-11-19 11:44:07.688
f01b22a2-de44-431e-9b12-9ad4bfd0c801	NTVLY-003	Nature Valley Deluxe	Nature Valley Deluxe Bar - Single Unit	280022685253	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	73ae9ec4-896c-4451-b699-0921c164345d	SIMPLE	ACTIVE	15	5	2	0.05	cm	kg	0.75	1.5	GBP	t	t	f	365	{}	2025-11-19 11:44:07.692	2025-11-19 11:44:07.692
c7a1f76d-517a-4dfd-95db-200a7e767ac8	NTVLY-BDL-003	Nature Valley Deluxe - 12 Pack	Nature Valley Deluxe Bar - Case of 12	924310787600	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	73ae9ec4-896c-4451-b699-0921c164345d	BUNDLE	ACTIVE	30	20	10	0.6	cm	kg	9	15	GBP	t	t	f	365	{}	2025-11-19 11:44:07.695	2025-11-19 11:44:07.695
\.


--
-- Data for Name: ReplenishmentConfig; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public."ReplenishmentConfig" (id, "productId", "minStockLevel", "maxStockLevel", "reorderPoint", "reorderQuantity", "autoCreateTasks", enabled, "createdAt", "updatedAt") FROM stdin;
b3c2b471-dc0b-4f92-9463-79d8b00ba99c	c2bf33c2-65da-4800-99d8-f510431025f2	100	500	150	300	t	t	2025-11-19 11:44:07.826	2025-11-19 11:44:07.826
70dca4a8-d49c-42e6-8323-ec639eb0989d	575bb91e-4ae2-4841-931e-fb1667ce544e	100	500	150	300	t	t	2025-11-19 11:44:07.83	2025-11-19 11:44:07.83
9e43173c-4f7e-459e-8178-beea9ee689fe	3f618851-f529-45d2-a466-934713d86aa4	100	500	150	300	t	t	2025-11-19 11:44:07.832	2025-11-19 11:44:07.832
3dc994c3-c188-4c9f-9d13-92f75198e5d6	077c0fc8-95bb-4769-a7d4-c288beb71d7d	100	500	150	300	t	t	2025-11-19 11:44:07.834	2025-11-19 11:44:07.834
1fc790e4-80ce-4488-8c04-bf2187b9faad	7aab4882-2997-44ce-a80c-7bbd50025f8a	100	500	150	300	t	t	2025-11-19 11:44:07.835	2025-11-19 11:44:07.835
bad0e9e4-1e4c-4d7b-8246-09a274ec01f7	d2d60122-eda5-47a0-87de-f909bdf5a386	100	500	150	300	t	t	2025-11-19 11:44:07.837	2025-11-19 11:44:07.837
b7c1b9ae-1e02-470b-9ca1-5caf52a74c2b	55df8fe6-9551-4edf-ad87-21fecdb5b1dd	100	500	150	300	t	t	2025-11-19 11:44:07.839	2025-11-19 11:44:07.839
de461c80-ebd6-478b-8bae-53397b61e9a9	d94c04e9-e4bf-444c-87ee-5e7a033915e4	100	500	150	300	t	t	2025-11-19 11:44:07.841	2025-11-19 11:44:07.841
2f1fa648-4879-408f-8a95-d3109f44de58	6d6d968b-4df1-4bc4-aaca-989542eaeeea	100	500	150	300	t	t	2025-11-19 11:44:07.843	2025-11-19 11:44:07.843
9b1a2fc3-1a5a-4d39-b118-8fd62f392485	480aabb0-d869-419d-9669-ca125386399f	100	500	150	300	t	t	2025-11-19 11:44:07.845	2025-11-19 11:44:07.845
\.


--
-- Data for Name: ReplenishmentTask; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public."ReplenishmentTask" (id, "taskNumber", "productId", "fromLocation", "toLocation", "quantityNeeded", "quantityMoved", status, priority, "assignedUserId", notes, "createdAt", "completedAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SalesChannel; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public."SalesChannel" (id, name, code, type, "referralFeePercent", "fixedFee", "fulfillmentFeePerUnit", "storageFeePerUnit", "additionalFees", "isActive", "createdAt", "updatedAt") FROM stdin;
1e483ee9-fb0c-46ce-984c-8c263b4021a6	Amazon FBA UK	AMZN-FBA-UK	AMAZON_FBA	15	\N	2.5	\N	\N	t	2025-11-19 11:44:07.847	2025-11-19 11:44:07.847
a2ebc16e-2fbe-4e0d-9514-2e132500b889	Shopify Retail	SHOPIFY-RETAIL	SHOPIFY	2.9	0.3	\N	\N	\N	t	2025-11-19 11:44:07.851	2025-11-19 11:44:07.851
1c3087fe-e713-4a7a-8eac-65cbb26dbf50	Shopify B2B	SHOPIFY-B2B	SHOPIFY	2.9	0.3	\N	\N	\N	t	2025-11-19 11:44:07.853	2025-11-19 11:44:07.853
496f3313-c9aa-4873-b2fe-64aefeb85b66	eBay UK	EBAY-UK	EBAY	12.8	0.3	\N	\N	\N	t	2025-11-19 11:44:07.855	2025-11-19 11:44:07.855
8346d447-3972-4fe7-a6d7-14db88c4993d	Direct Wholesale	DIRECT-WHOLESALE	WHOLESALE	0	0	\N	\N	\N	t	2025-11-19 11:44:07.857	2025-11-19 11:44:07.857
\.


--
-- Data for Name: SalesOrder; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public."SalesOrder" (id, "orderNumber", "customerId", "isWholesale", "salesChannel", "externalOrderId", status, priority, subtotal, "taxAmount", "shippingCost", "discountAmount", "totalAmount", "shippingAddress", "shippingMethod", "trackingNumber", notes, "orderDate", "requiredDate", "shippedDate", "createdAt", "updatedAt") FROM stdin;
fca0e60f-0b9c-4ae2-bf54-78b138cf6126	SO-000001	88de4fc3-bec0-446a-b957-a17b10c2d1f9	t	Shopify B2B	SHOP-JCO1ALUJEP	PENDING	LOW	1170	234	0	0	1404	63985 W 11th Street	Pallet	\N	\N	2025-11-19 11:44:08.019	\N	\N	2025-11-19 11:44:08.02	2025-11-19 11:44:08.02
1571f5a0-366b-4bf5-95ff-f30d84b9fd89	SO-000002	0ab20f64-d007-4f49-ac33-930403a2372e	f	Shopify Retail	SHOP-PDGNSX2U6Z	CONFIRMED	HIGH	13.5	2.7	5.99	0	22.19	8747 S Walnut Street	Standard	\N	\N	2025-11-19 11:44:08.03	\N	\N	2025-11-19 11:44:08.031	2025-11-19 11:44:08.031
767da174-8b3e-49cc-a0e9-6f74e1dd601e	SO-000003	0ab20f64-d007-4f49-ac33-930403a2372e	f	Shopify Retail	SHOP-PGCZUBU1KE	CONFIRMED	HIGH	13.5	2.7	5.99	0	22.19	8747 S Walnut Street	Standard	\N	\N	2025-11-19 11:44:08.036	\N	\N	2025-11-19 11:44:08.037	2025-11-19 11:44:08.037
a4768c41-518f-4afb-b159-ef2856bda1d8	SO-000004	0ab20f64-d007-4f49-ac33-930403a2372e	f	Shopify Retail	SHOP-SLYKSTBGGX	ALLOCATED	MEDIUM	15	3	5.99	0	23.99	8747 S Walnut Street	Standard	\N	\N	2025-11-19 11:44:08.041	\N	\N	2025-11-19 11:44:08.042	2025-11-19 11:44:08.042
0d33da9a-8f5f-47af-bdf1-1394d6ee62cd	SO-000005	88de4fc3-bec0-446a-b957-a17b10c2d1f9	t	Shopify B2B	SHOP-GAM0ANGLWA	CONFIRMED	LOW	510	102	0	0	612	63985 W 11th Street	Pallet	\N	\N	2025-11-19 11:44:08.046	\N	\N	2025-11-19 11:44:08.047	2025-11-19 11:44:08.047
f828f1a3-2c72-4ec5-8f9a-163b0f4b3976	SO-000006	0ab20f64-d007-4f49-ac33-930403a2372e	f	Shopify Retail	SHOP-3GEC4DKOTD	CONFIRMED	MEDIUM	19.5	3.9	5.99	0	29.39	8747 S Walnut Street	Standard	\N	\N	2025-11-19 11:44:08.051	\N	\N	2025-11-19 11:44:08.052	2025-11-19 11:44:08.052
212731fc-3dcd-4949-b379-2304397e0c46	SO-000007	0ab20f64-d007-4f49-ac33-930403a2372e	f	Shopify Retail	SHOP-TJUYNZNYNJ	CONFIRMED	HIGH	10.5	2.1	5.99	0	18.59	8747 S Walnut Street	Standard	\N	\N	2025-11-19 11:44:08.057	\N	\N	2025-11-19 11:44:08.058	2025-11-19 11:44:08.058
406ac9ce-5011-44f1-99da-aa6439e7ab26	SO-000008	0ab20f64-d007-4f49-ac33-930403a2372e	f	Shopify Retail	SHOP-7VFYDWIDTU	PENDING	HIGH	3	0.6000000000000001	5.99	0	9.59	8747 S Walnut Street	Standard	\N	\N	2025-11-19 11:44:08.064	\N	\N	2025-11-19 11:44:08.065	2025-11-19 11:44:08.065
67725e88-9757-4d33-b64a-d48176cb67cc	SO-000009	88de4fc3-bec0-446a-b957-a17b10c2d1f9	t	Shopify B2B	SHOP-VN6PKTBVYH	CONFIRMED	LOW	825	165	0	0	990	63985 W 11th Street	Pallet	\N	\N	2025-11-19 11:44:08.068	\N	\N	2025-11-19 11:44:08.069	2025-11-19 11:44:08.069
46472e11-b504-4cb7-a385-fb41c53c89f2	SO-000010	0ab20f64-d007-4f49-ac33-930403a2372e	f	Shopify Retail	SHOP-KV4BAJCCHM	CONFIRMED	HIGH	10.5	2.1	5.99	0	18.59	8747 S Walnut Street	Standard	\N	\N	2025-11-19 11:44:08.075	\N	\N	2025-11-19 11:44:08.075	2025-11-19 11:44:08.075
7a0646a5-8174-4a41-9302-639c060c15f5	SO-000011	0ab20f64-d007-4f49-ac33-930403a2372e	f	Shopify Retail	SHOP-FZOQLTC9EE	ALLOCATED	LOW	30	6	5.99	0	41.99	8747 S Walnut Street	Standard	\N	\N	2025-11-19 11:44:08.08	\N	\N	2025-11-19 11:44:08.081	2025-11-19 11:44:08.081
2038910c-49bf-4647-b76d-44303914dce2	SO-000012	0ab20f64-d007-4f49-ac33-930403a2372e	f	Shopify Retail	SHOP-2BWYPL8NAF	ALLOCATED	LOW	15	3	5.99	0	23.99	8747 S Walnut Street	Standard	\N	\N	2025-11-19 11:44:08.087	\N	\N	2025-11-19 11:44:08.088	2025-11-19 11:44:08.088
f4b17671-7e8e-4423-ab3b-e35cb72f2ec5	SO-000013	88de4fc3-bec0-446a-b957-a17b10c2d1f9	t	Shopify B2B	SHOP-SMZJYEHZOS	CONFIRMED	LOW	915	183	0	0	1098	63985 W 11th Street	Pallet	\N	\N	2025-11-19 11:44:08.093	\N	\N	2025-11-19 11:44:08.094	2025-11-19 11:44:08.094
1274aa7c-9f3b-403e-95a8-6d98c61d09df	SO-000014	0ab20f64-d007-4f49-ac33-930403a2372e	f	Shopify Retail	SHOP-IPMY7VB78I	ALLOCATED	HIGH	19.5	3.9	5.99	0	29.39	8747 S Walnut Street	Standard	\N	\N	2025-11-19 11:44:08.1	\N	\N	2025-11-19 11:44:08.101	2025-11-19 11:44:08.101
fdd25a98-1c97-4c26-9cb3-9b1cb11e6944	SO-000015	0ab20f64-d007-4f49-ac33-930403a2372e	f	Shopify Retail	SHOP-VOFPBWX2TO	ALLOCATED	LOW	10.5	2.1	5.99	0	18.59	8747 S Walnut Street	Standard	\N	\N	2025-11-19 11:44:08.106	\N	\N	2025-11-19 11:44:08.107	2025-11-19 11:44:08.107
9ada28e8-2d64-43b0-9bf1-bafa9b96e85f	SO-000016	0ab20f64-d007-4f49-ac33-930403a2372e	f	Shopify Retail	SHOP-J7ZO2HZV1S	ALLOCATED	HIGH	7.5	1.5	5.99	0	14.99	8747 S Walnut Street	Standard	\N	\N	2025-11-19 11:44:08.112	\N	\N	2025-11-19 11:44:08.113	2025-11-19 11:44:08.113
d8107de5-8d91-417a-aa4e-65fcee6ae1b6	SO-000017	88de4fc3-bec0-446a-b957-a17b10c2d1f9	t	Shopify B2B	SHOP-RZZTEY3EOW	ALLOCATED	HIGH	360	72	0	0	432	63985 W 11th Street	Pallet	\N	\N	2025-11-19 11:44:08.118	\N	\N	2025-11-19 11:44:08.119	2025-11-19 11:44:08.119
f26f685e-b167-4fb3-8ab6-ddabc80d0584	SO-000018	0ab20f64-d007-4f49-ac33-930403a2372e	f	Shopify Retail	SHOP-VHGCRDRCLY	PENDING	LOW	18	3.6	5.99	0	27.59	8747 S Walnut Street	Standard	\N	\N	2025-11-19 11:44:08.124	\N	\N	2025-11-19 11:44:08.125	2025-11-19 11:44:08.125
6c9a2f1c-532e-4488-b15d-e3c4019a597c	SO-000019	0ab20f64-d007-4f49-ac33-930403a2372e	f	Shopify Retail	SHOP-HJUTRRTMZQ	PENDING	LOW	4.5	0.9	5.99	0	11.39	8747 S Walnut Street	Standard	\N	\N	2025-11-19 11:44:08.133	\N	\N	2025-11-19 11:44:08.134	2025-11-19 11:44:08.134
a3b96028-03a8-4f51-a9ea-3d560f450692	SO-000020	0ab20f64-d007-4f49-ac33-930403a2372e	f	Shopify Retail	SHOP-VLCWUJN59I	CONFIRMED	HIGH	7.5	1.5	5.99	0	14.99	8747 S Walnut Street	Standard	\N	\N	2025-11-19 11:44:08.138	\N	\N	2025-11-19 11:44:08.139	2025-11-19 11:44:08.139
c78b859a-7bba-4c69-8f1d-e8be28d8bbd0	SO-000021	88de4fc3-bec0-446a-b957-a17b10c2d1f9	t	Shopify B2B	SHOP-MMTXGS4N9W	PENDING	LOW	975	195	0	0	1170	63985 W 11th Street	Pallet	\N	\N	2025-11-19 11:44:08.144	\N	\N	2025-11-19 11:44:08.144	2025-11-19 11:44:08.144
21adc4d3-f749-41b9-a633-e6b0bb87e785	SO-000022	0ab20f64-d007-4f49-ac33-930403a2372e	f	Shopify Retail	SHOP-FCKWS74RNH	PENDING	LOW	10.5	2.1	5.99	0	18.59	8747 S Walnut Street	Standard	\N	\N	2025-11-19 11:44:08.151	\N	\N	2025-11-19 11:44:08.152	2025-11-19 11:44:08.152
d5b9ba47-c73d-4fe2-abce-9c1d05cc2c9f	SO-000023	0ab20f64-d007-4f49-ac33-930403a2372e	f	Shopify Retail	SHOP-QCOD4YZDYZ	CONFIRMED	HIGH	16.5	3.3	5.99	0	25.79	8747 S Walnut Street	Standard	\N	\N	2025-11-19 11:44:08.158	\N	\N	2025-11-19 11:44:08.159	2025-11-19 11:44:08.159
7f847635-8203-4afe-b22d-60de8cebe736	SO-000024	0ab20f64-d007-4f49-ac33-930403a2372e	f	Shopify Retail	SHOP-K2AGEYXECA	ALLOCATED	LOW	6	1.2	5.99	0	13.19	8747 S Walnut Street	Standard	\N	\N	2025-11-19 11:44:08.166	\N	\N	2025-11-19 11:44:08.167	2025-11-19 11:44:08.167
1eb73025-1bd5-4d59-bd63-98a6e9d0cb29	SO-000025	88de4fc3-bec0-446a-b957-a17b10c2d1f9	t	Shopify B2B	SHOP-TEENANXSNS	ALLOCATED	MEDIUM	630	126	0	0	756	63985 W 11th Street	Pallet	\N	\N	2025-11-19 11:44:08.171	\N	\N	2025-11-19 11:44:08.172	2025-11-19 11:44:08.172
6f7638b8-fe48-44c5-881e-83970873a790	SO-000026	0ab20f64-d007-4f49-ac33-930403a2372e	f	Shopify Retail	SHOP-JPMK9KRGXN	CONFIRMED	HIGH	21	4.2	5.99	0	31.19	8747 S Walnut Street	Standard	\N	\N	2025-11-19 11:44:08.178	\N	\N	2025-11-19 11:44:08.179	2025-11-19 11:44:08.179
5855a8b2-0a3f-46a4-8bde-d2ef6443669b	SO-000027	0ab20f64-d007-4f49-ac33-930403a2372e	f	Shopify Retail	SHOP-GJSLYMKTOV	PENDING	MEDIUM	18	3.6	5.99	0	27.59	8747 S Walnut Street	Standard	\N	\N	2025-11-19 11:44:08.185	\N	\N	2025-11-19 11:44:08.186	2025-11-19 11:44:08.186
e1458ca2-5289-478e-a791-0f9244888d9c	SO-000028	0ab20f64-d007-4f49-ac33-930403a2372e	f	Shopify Retail	SHOP-VDNWQDZGQM	ALLOCATED	HIGH	7.5	1.5	5.99	0	14.99	8747 S Walnut Street	Standard	\N	\N	2025-11-19 11:44:08.193	\N	\N	2025-11-19 11:44:08.194	2025-11-19 11:44:08.194
c725c98d-edb3-4387-bbac-59508156f45e	SO-000029	88de4fc3-bec0-446a-b957-a17b10c2d1f9	t	Shopify B2B	SHOP-ELQPUC09SE	PENDING	HIGH	1200	240	0	0	1440	63985 W 11th Street	Pallet	\N	\N	2025-11-19 11:44:08.199	\N	\N	2025-11-19 11:44:08.2	2025-11-19 11:44:08.2
de05a61e-58ba-497e-a7d3-658ff02eda87	SO-000030	0ab20f64-d007-4f49-ac33-930403a2372e	f	Shopify Retail	SHOP-5AUSDGG4OA	PENDING	MEDIUM	21	4.2	5.99	0	31.19	8747 S Walnut Street	Standard	\N	\N	2025-11-19 11:44:08.207	\N	\N	2025-11-19 11:44:08.208	2025-11-19 11:44:08.208
\.


--
-- Data for Name: SalesOrderItem; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public."SalesOrderItem" (id, "orderId", "productId", quantity, "unitPrice", discount, tax, "totalPrice", "createdAt") FROM stdin;
c83ece95-3f1c-4b05-b268-ff1c0067df88	fca0e60f-0b9c-4ae2-bf54-78b138cf6126	5e2ca2ad-7bf8-4d44-8299-3f6b0ea4c72c	19	15	0	57	285	2025-11-19 11:44:08.02
8b040731-f1e8-4498-96c2-6f8bb01417d5	fca0e60f-0b9c-4ae2-bf54-78b138cf6126	588729d7-1295-4b24-a66e-fada023b0b51	20	15	0	60	300	2025-11-19 11:44:08.02
ed476217-bb05-4f84-9b6f-f631b4309cce	fca0e60f-0b9c-4ae2-bf54-78b138cf6126	a5743087-6dc2-4be2-86a1-b3111215d82f	17	15	0	51	255	2025-11-19 11:44:08.02
410c58c9-639d-4075-a968-cea4c9410f0f	fca0e60f-0b9c-4ae2-bf54-78b138cf6126	cd2d14a1-3b3a-4979-9051-7df1bd310293	6	15	0	18	90	2025-11-19 11:44:08.02
822900ec-94ef-4967-a968-9e0172fcd2c5	fca0e60f-0b9c-4ae2-bf54-78b138cf6126	3bce830c-79b4-4427-b20f-800cd2220d5e	16	15	0	48	240	2025-11-19 11:44:08.02
a7a82d59-fe17-4efa-8d4a-c8bd025252c4	1571f5a0-366b-4bf5-95ff-f30d84b9fd89	3f618851-f529-45d2-a466-934713d86aa4	5	1.5	0	1.5	7.5	2025-11-19 11:44:08.031
1db5423b-ae87-4790-8b68-b60b1224167d	1571f5a0-366b-4bf5-95ff-f30d84b9fd89	c2bf33c2-65da-4800-99d8-f510431025f2	4	1.5	0	1.2	6	2025-11-19 11:44:08.031
8145cb05-b8cb-4f0c-bc4f-3102f9256751	767da174-8b3e-49cc-a0e9-6f74e1dd601e	0284163e-aa5a-45b5-8191-803fea0f3551	4	1.5	0	1.2	6	2025-11-19 11:44:08.037
72727fa0-3eb8-4456-866f-dbb6dbc123e4	767da174-8b3e-49cc-a0e9-6f74e1dd601e	7aab4882-2997-44ce-a80c-7bbd50025f8a	5	1.5	0	1.5	7.5	2025-11-19 11:44:08.037
4dabb85d-7982-43b3-8218-11d3344ddd91	a4768c41-518f-4afb-b159-ef2856bda1d8	3e3ec351-573e-4b14-9e18-19c723f5e4de	2	1.5	0	0.6000000000000001	3	2025-11-19 11:44:08.042
e7718b3f-c7ad-4abb-87b7-db6b088988de	a4768c41-518f-4afb-b159-ef2856bda1d8	7aab4882-2997-44ce-a80c-7bbd50025f8a	3	1.5	0	0.9	4.5	2025-11-19 11:44:08.042
063f003a-401a-4e27-96dc-707b0c6b6215	a4768c41-518f-4afb-b159-ef2856bda1d8	480aabb0-d869-419d-9669-ca125386399f	5	1.5	0	1.5	7.5	2025-11-19 11:44:08.042
0cfbcd09-8ff1-4dad-9dc6-0ccbaf4c89ec	0d33da9a-8f5f-47af-bdf1-1394d6ee62cd	3bce830c-79b4-4427-b20f-800cd2220d5e	18	15	0	54	270	2025-11-19 11:44:08.047
7754295a-6a09-4ded-90b7-749d9c1a8eef	0d33da9a-8f5f-47af-bdf1-1394d6ee62cd	1916e212-298a-478f-884a-c11bf0119914	16	15	0	48	240	2025-11-19 11:44:08.047
b5e66eb6-d81b-4db1-b36c-f4ebfaac7aa3	f828f1a3-2c72-4ec5-8f9a-163b0f4b3976	55df8fe6-9551-4edf-ad87-21fecdb5b1dd	3	1.5	0	0.9	4.5	2025-11-19 11:44:08.052
95e5a7c8-2d3c-45bc-aa9f-89365f9827b1	f828f1a3-2c72-4ec5-8f9a-163b0f4b3976	575bb91e-4ae2-4841-931e-fb1667ce544e	1	1.5	0	0.3	1.5	2025-11-19 11:44:08.052
93a815d8-a82d-401d-afd7-ec1270c89e26	f828f1a3-2c72-4ec5-8f9a-163b0f4b3976	3e3ec351-573e-4b14-9e18-19c723f5e4de	2	1.5	0	0.6000000000000001	3	2025-11-19 11:44:08.052
51f93ba7-e115-4196-b84e-44d35477be6f	f828f1a3-2c72-4ec5-8f9a-163b0f4b3976	f01b22a2-de44-431e-9b12-9ad4bfd0c801	5	1.5	0	1.5	7.5	2025-11-19 11:44:08.052
3117632e-3b80-4186-94fe-185b3eff1a87	f828f1a3-2c72-4ec5-8f9a-163b0f4b3976	077c0fc8-95bb-4769-a7d4-c288beb71d7d	2	1.5	0	0.6000000000000001	3	2025-11-19 11:44:08.052
486abca6-1105-45cd-8f02-b2294cee6eb9	212731fc-3dcd-4949-b379-2304397e0c46	a12fd2f9-6ca0-4763-a1cb-97f5b0541fc6	1	1.5	0	0.3	1.5	2025-11-19 11:44:08.058
502940e7-67d2-4a29-8120-9dd95437110f	212731fc-3dcd-4949-b379-2304397e0c46	575bb91e-4ae2-4841-931e-fb1667ce544e	2	1.5	0	0.6000000000000001	3	2025-11-19 11:44:08.058
7031fc85-f502-4f47-a9a2-08d0a05d1473	212731fc-3dcd-4949-b379-2304397e0c46	480aabb0-d869-419d-9669-ca125386399f	1	1.5	0	0.3	1.5	2025-11-19 11:44:08.058
464bad86-5ec9-4693-abc6-cd9ad71f53cc	212731fc-3dcd-4949-b379-2304397e0c46	077c0fc8-95bb-4769-a7d4-c288beb71d7d	1	1.5	0	0.3	1.5	2025-11-19 11:44:08.058
b06c138d-5129-4cfd-910c-fe07f95c2ba0	212731fc-3dcd-4949-b379-2304397e0c46	c2bf33c2-65da-4800-99d8-f510431025f2	2	1.5	0	0.6000000000000001	3	2025-11-19 11:44:08.058
c27a64fe-3468-49de-a844-0def5e2a3f8b	406ac9ce-5011-44f1-99da-aa6439e7ab26	7aab4882-2997-44ce-a80c-7bbd50025f8a	2	1.5	0	0.6000000000000001	3	2025-11-19 11:44:08.065
1306e5ed-188e-43af-b651-ab8419166409	67725e88-9757-4d33-b64a-d48176cb67cc	cd2d14a1-3b3a-4979-9051-7df1bd310293	17	15	0	51	255	2025-11-19 11:44:08.069
1c1c6aa9-d91c-4c1a-86da-11df930cd74c	67725e88-9757-4d33-b64a-d48176cb67cc	3bce830c-79b4-4427-b20f-800cd2220d5e	16	15	0	48	240	2025-11-19 11:44:08.069
42ab081f-83dd-4c5d-9c58-92c8df118dbf	67725e88-9757-4d33-b64a-d48176cb67cc	faa7321e-070b-42c1-90d7-560d0fc2c245	14	15	0	42	210	2025-11-19 11:44:08.069
aa039175-351f-42ec-91a9-a2425f567649	67725e88-9757-4d33-b64a-d48176cb67cc	973f1e3a-1157-43f3-aaf4-d444cf252237	8	15	0	24	120	2025-11-19 11:44:08.069
1ea95d28-29fd-4edb-9a41-27744970137e	46472e11-b504-4cb7-a385-fb41c53c89f2	480aabb0-d869-419d-9669-ca125386399f	3	1.5	0	0.9	4.5	2025-11-19 11:44:08.075
8e4c1188-b393-4ee3-855c-533ce86ba0c2	46472e11-b504-4cb7-a385-fb41c53c89f2	f01b22a2-de44-431e-9b12-9ad4bfd0c801	4	1.5	0	1.2	6	2025-11-19 11:44:08.075
14925b2a-1c0d-43b2-b0e4-24f26e94d63b	7a0646a5-8174-4a41-9302-639c060c15f5	3e3ec351-573e-4b14-9e18-19c723f5e4de	4	1.5	0	1.2	6	2025-11-19 11:44:08.081
c23b97f4-a538-4d42-bae2-fd7a890991c4	7a0646a5-8174-4a41-9302-639c060c15f5	575bb91e-4ae2-4841-931e-fb1667ce544e	5	1.5	0	1.5	7.5	2025-11-19 11:44:08.081
48b1092c-ca6d-426f-9cf1-acfbd2eb23f3	7a0646a5-8174-4a41-9302-639c060c15f5	c2bf33c2-65da-4800-99d8-f510431025f2	4	1.5	0	1.2	6	2025-11-19 11:44:08.081
0b0ccfa9-eed8-4030-9f98-5d48539a52d9	7a0646a5-8174-4a41-9302-639c060c15f5	a12fd2f9-6ca0-4763-a1cb-97f5b0541fc6	5	1.5	0	1.5	7.5	2025-11-19 11:44:08.081
c8b9b6a4-d860-401c-85ae-7cca36200877	7a0646a5-8174-4a41-9302-639c060c15f5	480aabb0-d869-419d-9669-ca125386399f	2	1.5	0	0.6000000000000001	3	2025-11-19 11:44:08.081
f8c97f6e-b9c9-4dd3-b789-81b3c5119c4a	2038910c-49bf-4647-b76d-44303914dce2	077c0fc8-95bb-4769-a7d4-c288beb71d7d	5	1.5	0	1.5	7.5	2025-11-19 11:44:08.088
f681d1b8-d4a1-4caa-a6f1-6b26f5021a9a	2038910c-49bf-4647-b76d-44303914dce2	c2bf33c2-65da-4800-99d8-f510431025f2	5	1.5	0	1.5	7.5	2025-11-19 11:44:08.088
f383c1c2-971a-44ec-a035-76cf68303a78	f4b17671-7e8e-4423-ab3b-e35cb72f2ec5	1916e212-298a-478f-884a-c11bf0119914	19	15	0	57	285	2025-11-19 11:44:08.094
b2db99e5-4234-470b-a034-9200ab421a23	f4b17671-7e8e-4423-ab3b-e35cb72f2ec5	6fb2a109-4577-4382-a36a-f0c7df195a21	9	15	0	27	135	2025-11-19 11:44:08.094
d7216006-9fe2-4dbc-becb-97a058e2e895	f4b17671-7e8e-4423-ab3b-e35cb72f2ec5	35175ef5-1dad-4ca8-88cb-cf8e49624ec0	17	15	0	51	255	2025-11-19 11:44:08.094
9549dd6a-2e25-4662-882c-a0ab812c74f4	f4b17671-7e8e-4423-ab3b-e35cb72f2ec5	a5743087-6dc2-4be2-86a1-b3111215d82f	16	15	0	48	240	2025-11-19 11:44:08.094
1c8d3e5a-3fe5-4adb-83b6-bd2907606829	1274aa7c-9f3b-403e-95a8-6d98c61d09df	a12fd2f9-6ca0-4763-a1cb-97f5b0541fc6	4	1.5	0	1.2	6	2025-11-19 11:44:08.101
43176c18-7a13-4be7-9066-b0d760ac15aa	1274aa7c-9f3b-403e-95a8-6d98c61d09df	077c0fc8-95bb-4769-a7d4-c288beb71d7d	4	1.5	0	1.2	6	2025-11-19 11:44:08.101
4c59f61a-6eb8-4229-8b17-c2bf08b50cf9	1274aa7c-9f3b-403e-95a8-6d98c61d09df	c2bf33c2-65da-4800-99d8-f510431025f2	5	1.5	0	1.5	7.5	2025-11-19 11:44:08.101
2991cd94-784e-4fbd-94d3-02cc8439f87d	fdd25a98-1c97-4c26-9cb3-9b1cb11e6944	d2d60122-eda5-47a0-87de-f909bdf5a386	2	1.5	0	0.6000000000000001	3	2025-11-19 11:44:08.107
e5b9b67f-deeb-4999-99e3-03558b66151e	fdd25a98-1c97-4c26-9cb3-9b1cb11e6944	f8382845-039b-4149-88e2-c4c1f33bdea6	3	1.5	0	0.9	4.5	2025-11-19 11:44:08.107
99b9696a-a599-431f-8044-24061ec6fa8e	fdd25a98-1c97-4c26-9cb3-9b1cb11e6944	c2bf33c2-65da-4800-99d8-f510431025f2	2	1.5	0	0.6000000000000001	3	2025-11-19 11:44:08.107
fb78c974-d4ac-42f0-9c0c-3c1764b910ec	9ada28e8-2d64-43b0-9bf1-bafa9b96e85f	6d6d968b-4df1-4bc4-aaca-989542eaeeea	2	1.5	0	0.6000000000000001	3	2025-11-19 11:44:08.113
b0faee54-93d9-4bfe-817d-bd21bad97872	9ada28e8-2d64-43b0-9bf1-bafa9b96e85f	077c0fc8-95bb-4769-a7d4-c288beb71d7d	3	1.5	0	0.9	4.5	2025-11-19 11:44:08.113
fd42f3c2-5021-4de7-8ae4-8db9df0b460a	d8107de5-8d91-417a-aa4e-65fcee6ae1b6	01af1118-4686-4c68-930a-1e7ca64f0657	14	15	0	42	210	2025-11-19 11:44:08.119
37658186-ed58-4920-a431-24f4c0ab0029	d8107de5-8d91-417a-aa4e-65fcee6ae1b6	c7a1f76d-517a-4dfd-95db-200a7e767ac8	10	15	0	30	150	2025-11-19 11:44:08.119
7a6b5d21-2d5a-4d88-909c-7ff7d217dec8	f26f685e-b167-4fb3-8ab6-ddabc80d0584	d2d60122-eda5-47a0-87de-f909bdf5a386	3	1.5	0	0.9	4.5	2025-11-19 11:44:08.125
82baa965-f9be-4681-acfa-9d2c0ce221af	f26f685e-b167-4fb3-8ab6-ddabc80d0584	7aab4882-2997-44ce-a80c-7bbd50025f8a	1	1.5	0	0.3	1.5	2025-11-19 11:44:08.125
6492970e-8c08-4ceb-b890-eac761953ae4	f26f685e-b167-4fb3-8ab6-ddabc80d0584	354b59a9-cb3d-4032-bd62-001178924e1a	2	1.5	0	0.6000000000000001	3	2025-11-19 11:44:08.125
a626564a-4862-4f5a-b4e0-1b356bf5272b	f26f685e-b167-4fb3-8ab6-ddabc80d0584	a12fd2f9-6ca0-4763-a1cb-97f5b0541fc6	5	1.5	0	1.5	7.5	2025-11-19 11:44:08.125
2d778f5c-f2ec-437b-acb4-5a5b3290f25b	f26f685e-b167-4fb3-8ab6-ddabc80d0584	f01b22a2-de44-431e-9b12-9ad4bfd0c801	1	1.5	0	0.3	1.5	2025-11-19 11:44:08.125
43b26236-7d00-48b5-acec-634acf5980ee	6c9a2f1c-532e-4488-b15d-e3c4019a597c	480aabb0-d869-419d-9669-ca125386399f	3	1.5	0	0.9	4.5	2025-11-19 11:44:08.134
d07e5900-35d0-490c-87ef-d5bc5e1e7282	a3b96028-03a8-4f51-a9ea-3d560f450692	3e3ec351-573e-4b14-9e18-19c723f5e4de	5	1.5	0	1.5	7.5	2025-11-19 11:44:08.139
e91c7fcc-4c0c-4258-abec-f95900e98c24	c78b859a-7bba-4c69-8f1d-e8be28d8bbd0	35175ef5-1dad-4ca8-88cb-cf8e49624ec0	8	15	0	24	120	2025-11-19 11:44:08.144
0afde187-62e2-42d6-bf54-843ee189b1ad	c78b859a-7bba-4c69-8f1d-e8be28d8bbd0	588729d7-1295-4b24-a66e-fada023b0b51	6	15	0	18	90	2025-11-19 11:44:08.144
a83b947a-aeef-4ee4-98dd-7c0b58656f7c	c78b859a-7bba-4c69-8f1d-e8be28d8bbd0	01af1118-4686-4c68-930a-1e7ca64f0657	18	15	0	54	270	2025-11-19 11:44:08.144
7e6d9e61-5785-48eb-a81a-b167c1d442a1	c78b859a-7bba-4c69-8f1d-e8be28d8bbd0	6fb2a109-4577-4382-a36a-f0c7df195a21	13	15	0	39	195	2025-11-19 11:44:08.144
77326f16-100e-4620-8d78-ef97a8f070e3	c78b859a-7bba-4c69-8f1d-e8be28d8bbd0	21e4ab4a-681b-4341-b8de-41d4bfa76338	20	15	0	60	300	2025-11-19 11:44:08.144
4a6ca76d-ddc4-415a-a789-ab03249bd126	21adc4d3-f749-41b9-a633-e6b0bb87e785	3e3ec351-573e-4b14-9e18-19c723f5e4de	2	1.5	0	0.6000000000000001	3	2025-11-19 11:44:08.152
bddc09d1-ff0b-41c3-a6cb-cd6d5ab97bb8	21adc4d3-f749-41b9-a633-e6b0bb87e785	f8382845-039b-4149-88e2-c4c1f33bdea6	1	1.5	0	0.3	1.5	2025-11-19 11:44:08.152
7e7aef3d-8641-4737-8623-07cb45a0237d	21adc4d3-f749-41b9-a633-e6b0bb87e785	a12fd2f9-6ca0-4763-a1cb-97f5b0541fc6	1	1.5	0	0.3	1.5	2025-11-19 11:44:08.152
0c076fb2-a24e-4589-bf0f-0c403c079094	21adc4d3-f749-41b9-a633-e6b0bb87e785	f01b22a2-de44-431e-9b12-9ad4bfd0c801	3	1.5	0	0.9	4.5	2025-11-19 11:44:08.152
6450ba2a-d7e1-4bef-8381-52ba888ccd79	d5b9ba47-c73d-4fe2-abce-9c1d05cc2c9f	575bb91e-4ae2-4841-931e-fb1667ce544e	2	1.5	0	0.6000000000000001	3	2025-11-19 11:44:08.159
a453c616-f944-437a-a0c0-2b9212111bae	d5b9ba47-c73d-4fe2-abce-9c1d05cc2c9f	077c0fc8-95bb-4769-a7d4-c288beb71d7d	1	1.5	0	0.3	1.5	2025-11-19 11:44:08.159
932c8b3d-41cc-4135-9722-154deb623d50	d5b9ba47-c73d-4fe2-abce-9c1d05cc2c9f	7aab4882-2997-44ce-a80c-7bbd50025f8a	5	1.5	0	1.5	7.5	2025-11-19 11:44:08.159
d66949af-b5de-444e-8b92-07c9d17e1ac5	d5b9ba47-c73d-4fe2-abce-9c1d05cc2c9f	3e3ec351-573e-4b14-9e18-19c723f5e4de	3	1.5	0	0.9	4.5	2025-11-19 11:44:08.159
f16aa562-68af-48c7-9040-b589e5b26d66	7f847635-8203-4afe-b22d-60de8cebe736	6d6d968b-4df1-4bc4-aaca-989542eaeeea	4	1.5	0	1.2	6	2025-11-19 11:44:08.167
9f76c73a-c9c3-4392-89bd-1119fbe396f7	1eb73025-1bd5-4d59-bd63-98a6e9d0cb29	1916e212-298a-478f-884a-c11bf0119914	7	15	0	21	105	2025-11-19 11:44:08.172
a50d76f4-2940-4a8d-8012-620a7401c199	1eb73025-1bd5-4d59-bd63-98a6e9d0cb29	d9376524-9808-4971-afe6-925753c7b800	8	15	0	24	120	2025-11-19 11:44:08.172
eecceacc-011a-44c8-a495-9607a7626a3f	1eb73025-1bd5-4d59-bd63-98a6e9d0cb29	5e2ca2ad-7bf8-4d44-8299-3f6b0ea4c72c	16	15	0	48	240	2025-11-19 11:44:08.172
d9695785-51be-4edc-9163-24ffdb119201	1eb73025-1bd5-4d59-bd63-98a6e9d0cb29	35175ef5-1dad-4ca8-88cb-cf8e49624ec0	11	15	0	33	165	2025-11-19 11:44:08.172
06501169-f2cb-4df1-a9d9-45f67608ed9a	6f7638b8-fe48-44c5-881e-83970873a790	d94c04e9-e4bf-444c-87ee-5e7a033915e4	3	1.5	0	0.9	4.5	2025-11-19 11:44:08.179
593dc250-0200-4767-9308-e2c2a35ef26c	6f7638b8-fe48-44c5-881e-83970873a790	c2bf33c2-65da-4800-99d8-f510431025f2	4	1.5	0	1.2	6	2025-11-19 11:44:08.179
3dcfd09b-7e29-4a5f-891d-3b27ef1d9d33	6f7638b8-fe48-44c5-881e-83970873a790	480aabb0-d869-419d-9669-ca125386399f	5	1.5	0	1.5	7.5	2025-11-19 11:44:08.179
9332e1b5-706c-48fa-bd0c-af0fa772fdeb	6f7638b8-fe48-44c5-881e-83970873a790	f01b22a2-de44-431e-9b12-9ad4bfd0c801	2	1.5	0	0.6000000000000001	3	2025-11-19 11:44:08.179
75679946-463c-4dd0-b3dc-113b14edf3ba	5855a8b2-0a3f-46a4-8bde-d2ef6443669b	3f618851-f529-45d2-a466-934713d86aa4	2	1.5	0	0.6000000000000001	3	2025-11-19 11:44:08.186
a77193e0-39d8-4a8e-b707-a02f3716a8e0	5855a8b2-0a3f-46a4-8bde-d2ef6443669b	077c0fc8-95bb-4769-a7d4-c288beb71d7d	1	1.5	0	0.3	1.5	2025-11-19 11:44:08.186
8b41a422-8e90-45b5-a396-57d000b12571	5855a8b2-0a3f-46a4-8bde-d2ef6443669b	0284163e-aa5a-45b5-8191-803fea0f3551	5	1.5	0	1.5	7.5	2025-11-19 11:44:08.186
4b6caada-448e-4c05-87c0-cb929d3f1ae0	5855a8b2-0a3f-46a4-8bde-d2ef6443669b	575bb91e-4ae2-4841-931e-fb1667ce544e	3	1.5	0	0.9	4.5	2025-11-19 11:44:08.186
c677fde9-6c0c-49cd-8b2e-aabb809fc399	5855a8b2-0a3f-46a4-8bde-d2ef6443669b	3e3ec351-573e-4b14-9e18-19c723f5e4de	1	1.5	0	0.3	1.5	2025-11-19 11:44:08.186
55eee3f8-703e-41de-8141-d845fdb51e58	e1458ca2-5289-478e-a791-0f9244888d9c	7aab4882-2997-44ce-a80c-7bbd50025f8a	5	1.5	0	1.5	7.5	2025-11-19 11:44:08.194
3de2a7cf-cc3c-409e-8645-99a61b133bcb	c725c98d-edb3-4387-bbac-59508156f45e	1916e212-298a-478f-884a-c11bf0119914	19	15	0	57	285	2025-11-19 11:44:08.2
248afc62-7fd9-4109-8af0-cad8efac83c4	c725c98d-edb3-4387-bbac-59508156f45e	21e4ab4a-681b-4341-b8de-41d4bfa76338	15	15	0	45	225	2025-11-19 11:44:08.2
1a142ae7-4f6a-436b-a8be-f8a289b7de43	c725c98d-edb3-4387-bbac-59508156f45e	cd2d14a1-3b3a-4979-9051-7df1bd310293	18	15	0	54	270	2025-11-19 11:44:08.2
3e638c68-6d3d-418a-a510-a503a3839443	c725c98d-edb3-4387-bbac-59508156f45e	3bce830c-79b4-4427-b20f-800cd2220d5e	8	15	0	24	120	2025-11-19 11:44:08.2
fabb5533-ad97-4911-bd05-8fb3058cc26f	c725c98d-edb3-4387-bbac-59508156f45e	faa7321e-070b-42c1-90d7-560d0fc2c245	20	15	0	60	300	2025-11-19 11:44:08.2
876b083f-40f2-49a5-ab06-4a3e296e655c	de05a61e-58ba-497e-a7d3-658ff02eda87	7aab4882-2997-44ce-a80c-7bbd50025f8a	5	1.5	0	1.5	7.5	2025-11-19 11:44:08.208
98403841-fa9d-467c-b2fa-72de5c723856	de05a61e-58ba-497e-a7d3-658ff02eda87	c2bf33c2-65da-4800-99d8-f510431025f2	3	1.5	0	0.9	4.5	2025-11-19 11:44:08.208
e1724f06-4096-4f8d-af23-bcf188b3b886	de05a61e-58ba-497e-a7d3-658ff02eda87	480aabb0-d869-419d-9669-ca125386399f	3	1.5	0	0.9	4.5	2025-11-19 11:44:08.208
36a9108a-a960-4c75-a72e-5bae4e93e997	de05a61e-58ba-497e-a7d3-658ff02eda87	6d6d968b-4df1-4bc4-aaca-989542eaeeea	3	1.5	0	0.9	4.5	2025-11-19 11:44:08.208
\.


--
-- Data for Name: Supplier; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public."Supplier" (id, name, code, email, phone, address, "companyId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Transfer; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public."Transfer" (id, "transferNumber", type, "fromWarehouseId", "toWarehouseId", status, "fbaShipmentId", "fbaDestination", "shipmentBuilt", notes, "createdAt", "shippedAt", "receivedAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TransferItem; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public."TransferItem" (id, "transferId", "productId", quantity, "receivedQuantity", "isFBABundle", "fbaSku", "createdAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public."User" (id, email, password, name, role, "companyId", "createdAt", "updatedAt") FROM stdin;
b5f08e5d-8b4e-46f7-8ec8-40a81850a049	admin@kiaan.com	$2a$10$bYupRC1geIh/P5H/LSGrI.la6Jwv1BBXw3GEhi438DAvRagI2KOgm	Admin User	ADMIN	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	2025-11-19 11:44:07.478	2025-11-19 11:44:07.478
23a3a883-d7b6-4f6e-9316-eecc27ac9cd2	picker1@kiaan.com	$2a$10$bYupRC1geIh/P5H/LSGrI.la6Jwv1BBXw3GEhi438DAvRagI2KOgm	John Picker	PICKER	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	2025-11-19 11:44:07.483	2025-11-19 11:44:07.483
9530ff2a-fcfb-4080-afe1-11bc2cd04b08	picker2@kiaan.com	$2a$10$bYupRC1geIh/P5H/LSGrI.la6Jwv1BBXw3GEhi438DAvRagI2KOgm	Sarah Picker	PICKER	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	2025-11-19 11:44:07.486	2025-11-19 11:44:07.486
\.


--
-- Data for Name: Warehouse; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public."Warehouse" (id, name, code, type, "companyId", address, phone, capacity, status, "createdAt", "updatedAt") FROM stdin;
c483471e-7137-49fb-b871-316842b061fa	Main Distribution Center	WH-MAIN	MAIN	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	123 Distribution Lane, London, UK	+44 20 1234 5678	50000	ACTIVE	2025-11-19 11:44:07.488	2025-11-19 11:44:07.488
6705e2dc-4e4c-4dfd-8744-d2280f7d66d9	FBA Prep Warehouse	WH-PREP	PREP	53c65d84-4606-4b0a-8aa5-6eda9e50c3df	456 Prep Street, London, UK	+44 20 1234 5679	10000	ACTIVE	2025-11-19 11:44:07.492	2025-11-19 11:44:07.492
\.


--
-- Data for Name: Zone; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public."Zone" (id, name, code, "warehouseId", "zoneType", "createdAt", "updatedAt") FROM stdin;
7bb35ebd-8244-4d01-a0cd-998acce2c6ba	Zone A - Ambient	ZN-A	c483471e-7137-49fb-b871-316842b061fa	STANDARD	2025-11-19 11:44:07.495	2025-11-19 11:44:07.495
e7cd632e-3de1-4f52-80b2-c686a56a9682	Zone B - Ambient	ZN-B	c483471e-7137-49fb-b871-316842b061fa	STANDARD	2025-11-19 11:44:07.499	2025-11-19 11:44:07.499
\.


--
-- Data for Name: directus_access; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_access (id, role, "user", policy, sort) FROM stdin;
28d32b00-2ade-471c-ac12-36a8bd47f57e	\N	\N	abf8a154-5b1c-4a46-ac9c-7300570f4f17	1
02d8f994-c61d-4eac-a6c0-067ce1f9aa66	2c8fb5d6-e3a3-45b5-81c0-8e0847e0132b	\N	6ae085a6-005d-4e6a-ae7d-2018d7ca7872	\N
\.


--
-- Data for Name: directus_activity; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_activity (id, action, "user", "timestamp", ip, user_agent, collection, item, origin) FROM stdin;
\.


--
-- Data for Name: directus_collections; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_collections (collection, icon, note, display_template, hidden, singleton, translations, archive_field, archive_app_filter, archive_value, unarchive_value, sort_field, accountability, color, item_duplication_fields, sort, "group", collapse, preview_url, versioning) FROM stdin;
\.


--
-- Data for Name: directus_comments; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_comments (id, collection, item, comment, date_created, date_updated, user_created, user_updated) FROM stdin;
\.


--
-- Data for Name: directus_dashboards; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_dashboards (id, name, icon, note, date_created, user_created, color) FROM stdin;
\.


--
-- Data for Name: directus_extensions; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_extensions (enabled, id, folder, source, bundle) FROM stdin;
\.


--
-- Data for Name: directus_fields; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_fields (id, collection, field, special, interface, options, display, display_options, readonly, hidden, sort, width, translations, note, conditions, required, "group", validation, validation_message) FROM stdin;
\.


--
-- Data for Name: directus_files; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_files (id, storage, filename_disk, filename_download, title, type, folder, uploaded_by, created_on, modified_by, modified_on, charset, filesize, width, height, duration, embed, description, location, tags, metadata, focal_point_x, focal_point_y, tus_id, tus_data, uploaded_on) FROM stdin;
\.


--
-- Data for Name: directus_flows; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_flows (id, name, icon, color, description, status, trigger, accountability, options, operation, date_created, user_created) FROM stdin;
\.


--
-- Data for Name: directus_folders; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_folders (id, name, parent) FROM stdin;
\.


--
-- Data for Name: directus_migrations; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_migrations (version, name, "timestamp") FROM stdin;
20201028A	Remove Collection Foreign Keys	2025-11-22 10:01:14.832674+00
20201029A	Remove System Relations	2025-11-22 10:01:14.841345+00
20201029B	Remove System Collections	2025-11-22 10:01:14.848303+00
20201029C	Remove System Fields	2025-11-22 10:01:14.86034+00
20201105A	Add Cascade System Relations	2025-11-22 10:01:14.945997+00
20201105B	Change Webhook URL Type	2025-11-22 10:01:14.957521+00
20210225A	Add Relations Sort Field	2025-11-22 10:01:14.970396+00
20210304A	Remove Locked Fields	2025-11-22 10:01:14.977962+00
20210312A	Webhooks Collections Text	2025-11-22 10:01:14.993123+00
20210331A	Add Refresh Interval	2025-11-22 10:01:14.999349+00
20210415A	Make Filesize Nullable	2025-11-22 10:01:15.012062+00
20210416A	Add Collections Accountability	2025-11-22 10:01:15.018832+00
20210422A	Remove Files Interface	2025-11-22 10:01:15.022362+00
20210506A	Rename Interfaces	2025-11-22 10:01:15.064504+00
20210510A	Restructure Relations	2025-11-22 10:01:15.108865+00
20210518A	Add Foreign Key Constraints	2025-11-22 10:01:15.125481+00
20210519A	Add System Fk Triggers	2025-11-22 10:01:15.186193+00
20210521A	Add Collections Icon Color	2025-11-22 10:01:15.191035+00
20210525A	Add Insights	2025-11-22 10:01:15.232723+00
20210608A	Add Deep Clone Config	2025-11-22 10:01:15.241393+00
20210626A	Change Filesize Bigint	2025-11-22 10:01:15.268426+00
20210716A	Add Conditions to Fields	2025-11-22 10:01:15.272684+00
20210721A	Add Default Folder	2025-11-22 10:01:15.28139+00
20210802A	Replace Groups	2025-11-22 10:01:15.287347+00
20210803A	Add Required to Fields	2025-11-22 10:01:15.292672+00
20210805A	Update Groups	2025-11-22 10:01:15.298513+00
20210805B	Change Image Metadata Structure	2025-11-22 10:01:15.30529+00
20210811A	Add Geometry Config	2025-11-22 10:01:15.311338+00
20210831A	Remove Limit Column	2025-11-22 10:01:15.31674+00
20210903A	Add Auth Provider	2025-11-22 10:01:15.341848+00
20210907A	Webhooks Collections Not Null	2025-11-22 10:01:15.35474+00
20210910A	Move Module Setup	2025-11-22 10:01:15.362582+00
20210920A	Webhooks URL Not Null	2025-11-22 10:01:15.378817+00
20210924A	Add Collection Organization	2025-11-22 10:01:15.387727+00
20210927A	Replace Fields Group	2025-11-22 10:01:15.402994+00
20210927B	Replace M2M Interface	2025-11-22 10:01:15.406674+00
20210929A	Rename Login Action	2025-11-22 10:01:15.410381+00
20211007A	Update Presets	2025-11-22 10:01:15.420279+00
20211009A	Add Auth Data	2025-11-22 10:01:15.425715+00
20211016A	Add Webhook Headers	2025-11-22 10:01:15.431344+00
20211103A	Set Unique to User Token	2025-11-22 10:01:15.442456+00
20211103B	Update Special Geometry	2025-11-22 10:01:15.448063+00
20211104A	Remove Collections Listing	2025-11-22 10:01:15.454336+00
20211118A	Add Notifications	2025-11-22 10:01:15.482119+00
20211211A	Add Shares	2025-11-22 10:01:15.504349+00
20211230A	Add Project Descriptor	2025-11-22 10:01:15.507742+00
20220303A	Remove Default Project Color	2025-11-22 10:01:15.516482+00
20220308A	Add Bookmark Icon and Color	2025-11-22 10:01:15.520005+00
20220314A	Add Translation Strings	2025-11-22 10:01:15.523084+00
20220322A	Rename Field Typecast Flags	2025-11-22 10:01:15.527848+00
20220323A	Add Field Validation	2025-11-22 10:01:15.53107+00
20220325A	Fix Typecast Flags	2025-11-22 10:01:15.535241+00
20220325B	Add Default Language	2025-11-22 10:01:15.548916+00
20220402A	Remove Default Value Panel Icon	2025-11-22 10:01:15.563663+00
20220429A	Add Flows	2025-11-22 10:01:15.634281+00
20220429B	Add Color to Insights Icon	2025-11-22 10:01:15.639893+00
20220429C	Drop Non Null From IP of Activity	2025-11-22 10:01:15.644445+00
20220429D	Drop Non Null From Sender of Notifications	2025-11-22 10:01:15.649278+00
20220614A	Rename Hook Trigger to Event	2025-11-22 10:01:15.65352+00
20220801A	Update Notifications Timestamp Column	2025-11-22 10:01:15.665198+00
20220802A	Add Custom Aspect Ratios	2025-11-22 10:01:15.670221+00
20220826A	Add Origin to Accountability	2025-11-22 10:01:15.679625+00
20230401A	Update Material Icons	2025-11-22 10:01:15.695662+00
20230525A	Add Preview Settings	2025-11-22 10:01:15.700045+00
20230526A	Migrate Translation Strings	2025-11-22 10:01:15.718286+00
20230721A	Require Shares Fields	2025-11-22 10:01:15.725837+00
20230823A	Add Content Versioning	2025-11-22 10:01:15.760462+00
20230927A	Themes	2025-11-22 10:01:15.798981+00
20231009A	Update CSV Fields to Text	2025-11-22 10:01:15.803899+00
20231009B	Update Panel Options	2025-11-22 10:01:15.807739+00
20231010A	Add Extensions	2025-11-22 10:01:15.816952+00
20231215A	Add Focalpoints	2025-11-22 10:01:15.822841+00
20240122A	Add Report URL Fields	2025-11-22 10:01:15.828589+00
20240204A	Marketplace	2025-11-22 10:01:15.872241+00
20240305A	Change Useragent Type	2025-11-22 10:01:15.887126+00
20240311A	Deprecate Webhooks	2025-11-22 10:01:15.907206+00
20240422A	Public Registration	2025-11-22 10:01:15.921006+00
20240515A	Add Session Window	2025-11-22 10:01:15.925683+00
20240701A	Add Tus Data	2025-11-22 10:01:15.930061+00
20240716A	Update Files Date Fields	2025-11-22 10:01:15.939646+00
20240806A	Permissions Policies	2025-11-22 10:01:16.024967+00
20240817A	Update Icon Fields Length	2025-11-22 10:01:16.07504+00
20240909A	Separate Comments	2025-11-22 10:01:16.096138+00
20240909B	Consolidate Content Versioning	2025-11-22 10:01:16.100481+00
20240924A	Migrate Legacy Comments	2025-11-22 10:01:16.108261+00
20240924B	Populate Versioning Deltas	2025-11-22 10:01:16.114332+00
\.


--
-- Data for Name: directus_notifications; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_notifications (id, "timestamp", status, recipient, sender, subject, message, collection, item) FROM stdin;
\.


--
-- Data for Name: directus_operations; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_operations (id, name, key, type, position_x, position_y, options, resolve, reject, flow, date_created, user_created) FROM stdin;
\.


--
-- Data for Name: directus_panels; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_panels (id, dashboard, name, icon, color, show_header, note, type, position_x, position_y, width, height, options, date_created, user_created) FROM stdin;
\.


--
-- Data for Name: directus_permissions; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_permissions (id, collection, action, permissions, validation, presets, fields, policy) FROM stdin;
\.


--
-- Data for Name: directus_policies; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_policies (id, name, icon, description, ip_access, enforce_tfa, admin_access, app_access) FROM stdin;
abf8a154-5b1c-4a46-ac9c-7300570f4f17	$t:public_label	public	$t:public_description	\N	f	f	f
6ae085a6-005d-4e6a-ae7d-2018d7ca7872	Administrator	verified	$t:admin_description	\N	f	t	t
\.


--
-- Data for Name: directus_presets; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_presets (id, bookmark, "user", role, collection, search, layout, layout_query, layout_options, refresh_interval, filter, icon, color) FROM stdin;
\.


--
-- Data for Name: directus_relations; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_relations (id, many_collection, many_field, one_collection, one_field, one_collection_field, one_allowed_collections, junction_field, sort_field, one_deselect_action) FROM stdin;
\.


--
-- Data for Name: directus_revisions; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_revisions (id, activity, collection, item, data, delta, parent, version) FROM stdin;
\.


--
-- Data for Name: directus_roles; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_roles (id, name, icon, description, parent) FROM stdin;
2c8fb5d6-e3a3-45b5-81c0-8e0847e0132b	Administrator	verified	$t:admin_description	\N
\.


--
-- Data for Name: directus_sessions; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_sessions (token, "user", expires, ip, user_agent, share, origin, next_token) FROM stdin;
\.


--
-- Data for Name: directus_settings; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_settings (id, project_name, project_url, project_color, project_logo, public_foreground, public_background, public_note, auth_login_attempts, auth_password_policy, storage_asset_transform, storage_asset_presets, custom_css, storage_default_folder, basemaps, mapbox_key, module_bar, project_descriptor, default_language, custom_aspect_ratios, public_favicon, default_appearance, default_theme_light, theme_light_overrides, default_theme_dark, theme_dark_overrides, report_error_url, report_bug_url, report_feature_url, public_registration, public_registration_verify_email, public_registration_role, public_registration_email_filter) FROM stdin;
\.


--
-- Data for Name: directus_shares; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_shares (id, name, collection, item, role, password, user_created, date_created, date_start, date_end, times_used, max_uses) FROM stdin;
\.


--
-- Data for Name: directus_translations; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_translations (id, language, key, value) FROM stdin;
\.


--
-- Data for Name: directus_users; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_users (id, first_name, last_name, email, password, location, title, description, tags, avatar, language, tfa_secret, status, role, token, last_access, last_page, provider, external_identifier, auth_data, email_notifications, appearance, theme_dark, theme_light, theme_light_overrides, theme_dark_overrides) FROM stdin;
0fdd52ef-d540-4368-9a02-fc5ff6de5caf	Admin	User	admin@kiaan.com	$argon2id$v=19$m=65536,t=3,p=4$qI+AONu0ykWbBcX0x4Jx/A$wIWqjCtVG/nytX34XHku32dLUoJL0SYCseN4bwxwEc8	\N	\N	\N	\N	\N	\N	\N	active	2c8fb5d6-e3a3-45b5-81c0-8e0847e0132b	\N	\N	\N	default	\N	\N	t	\N	\N	\N	\N	\N
\.


--
-- Data for Name: directus_versions; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_versions (id, key, name, collection, item, hash, date_created, date_updated, user_created, user_updated, delta) FROM stdin;
\.


--
-- Data for Name: directus_webhooks; Type: TABLE DATA; Schema: public; Owner: wms_user
--

COPY public.directus_webhooks (id, name, method, url, status, data, actions, collections, headers, was_active_before_deprecation, migrated_flow) FROM stdin;
\.


--
-- Name: directus_activity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: wms_user
--

SELECT pg_catalog.setval('public.directus_activity_id_seq', 1, false);


--
-- Name: directus_fields_id_seq; Type: SEQUENCE SET; Schema: public; Owner: wms_user
--

SELECT pg_catalog.setval('public.directus_fields_id_seq', 1, false);


--
-- Name: directus_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: wms_user
--

SELECT pg_catalog.setval('public.directus_notifications_id_seq', 1, false);


--
-- Name: directus_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: wms_user
--

SELECT pg_catalog.setval('public.directus_permissions_id_seq', 1, false);


--
-- Name: directus_presets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: wms_user
--

SELECT pg_catalog.setval('public.directus_presets_id_seq', 1, false);


--
-- Name: directus_relations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: wms_user
--

SELECT pg_catalog.setval('public.directus_relations_id_seq', 1, false);


--
-- Name: directus_revisions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: wms_user
--

SELECT pg_catalog.setval('public.directus_revisions_id_seq', 1, false);


--
-- Name: directus_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: wms_user
--

SELECT pg_catalog.setval('public.directus_settings_id_seq', 1, false);


--
-- Name: directus_webhooks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: wms_user
--

SELECT pg_catalog.setval('public.directus_webhooks_id_seq', 1, false);


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

\unrestrict yoPxZ8uX9h6yKLQX93wY8kj881awEvCZC2a06wZw0W3RXdvviaHgCZFt2f5iLLX


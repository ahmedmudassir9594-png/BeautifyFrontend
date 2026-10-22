# 📋 Comprehensive Audit Logging System - MyBeautify E-Commerce

> **Architecture, Implementation Specification & Operational Guide for Audit Trails, Compliance, and Security Logs in MyBeautify E-Commerce.**

---

## 📑 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Why Audit Logging is Essential](#2-why-audit-logging-is-essential)
3. [Current System Audit Footprint](#3-current-system-audit-footprint)
4. [Enterprise Audit Log Data Model](#4-enterprise-audit-log-data-model)
5. [Audit Event Taxonomy (Actions & Categories)](#5-audit-event-taxonomy)
6. [Spring Boot Backend Architecture & Implementation](#6-spring-boot-backend-architecture--implementation)
   - [JPA Auditing Setup (AuditorAware)](#61-jpa-auditing-setup)
   - [AuditLog Entity Specification](#62-auditlog-entity-specification)
   - [Asynchronous Audit Logger Service](#63-asynchronous-audit-logger-service)
   - [Spring AOP Interceptor / Entity Listeners](#64-spring-aop-interceptor--event-publishing)
7. [Admin REST API Specifications](#7-admin-rest-api-specifications)
8. [Frontend Admin Dashboard Integration](#8-frontend-admin-dashboard-integration)
9. [Security, Privacy (PII) & Immutability Rules](#9-security-privacy-pii--immutability-rules)
10. [Data Retention & Performance Optimization](#10-data-retention--performance-optimization)

---

## 1. Executive Summary

In a modern e-commerce platform like **MyBeautify**, handling transactions, inventory, pricing, user identities, and role assignments requires strict governance. An **Audit Log** (also known as an **Audit Trail**) provides an immutable, chronological, and tamper-resistant record of who did what, when, and what changed across the system.

This documentation serves as the blueprint for extending the existing Spring Boot + MySQL + React architecture to support comprehensive enterprise-grade audit logging.

---

## 2. Why Audit Logging is Essential

| Objective | Business & Technical Impact |
| :--- | :--- |
| **Security & Fraud Prevention** | Detect unauthorized role escalations, brute-force login attempts, and suspicious admin actions. |
| **Catalog & Financial Accountability** | Track unauthorized price changes, inventory discrepancies, and coupon abuse. |
| **Dispute Resolution** | Verify order cancellation timelines, payment status transitions, and customer address updates. |
| **Regulatory Compliance** | Comply with GDPR, PCI-DSS, and e-commerce data protection standards. |
| **Operational Forensics** | Root-cause analysis during production incidents or erroneous bulk updates. |

---

## 3. Current System Audit Footprint

The project already has basic auditing foundational hooks in place:

1. **JPA Auditing Enabled**:
   - `CosmeticsEcommerceApplication.java` is annotated with `@EnableJpaAuditing`.
2. **Timestamp Tracking**:
   - Core entities (`User`, `Product`, `Order`, `Review`, `Coupon`) track creation and modification times:
     ```java
     @CreationTimestamp
     @Column(nullable = false, updatable = false)
     private Instant createdAt;

     @UpdateTimestamp
     private Instant updatedAt;
     ```
3. **Next Step**:
   - Moving from basic *timestamps* to full *event-driven activity & state change logging* (`AuditLog`).

---

## 4. Enterprise Audit Log Data Model

The proposed audit record tracks every mutation with actor identification, client metadata, and before/after diffs.

### Database Schema (`audit_logs`)

```sql
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    timestamp TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    actor_id BIGINT NULL,
    actor_email VARCHAR(190) NOT NULL DEFAULT 'SYSTEM',
    actor_role VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
    action VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NULL,
    old_value JSON NULL,
    new_value JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    details TEXT NULL,
    
    INDEX idx_audit_timestamp (timestamp DESC),
    INDEX idx_audit_actor (actor_id),
    INDEX idx_audit_entity (entity_name, entity_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 5. Audit Event Taxonomy

Every log entry belongs to an Action Category and Action Code:

### 1. Authentication & Identity (`AUTH`)
- `AUTH_LOGIN_SUCCESS` — User/Staff/Admin successfully logged in.
- `AUTH_LOGIN_FAILED` — Invalid credentials or disabled account.
- `AUTH_PASSWORD_RESET_REQUESTED` — Password reset token generated.
- `AUTH_PASSWORD_CHANGED` — Password successfully updated.
- `AUTH_LOGOUT` — Session terminated.

### 2. User & Access Administration (`USER_MGMT`)
- `USER_REGISTERED` — New customer account created.
- `USER_ROLE_CHANGED` — Role modified (e.g. `CUSTOMER` -> `STAFF` -> `ADMIN`).
- `USER_STATUS_TOGGLED` — Account enabled or suspended (`enabled: false`).

### 3. Catalog & Inventory (`CATALOG`)
- `PRODUCT_CREATED` — New product published.
- `PRODUCT_UPDATED` — Metadata, description, or ingredients modified.
- `PRODUCT_PRICE_CHANGED` — Critical price/discount price adjustment.
- `PRODUCT_STOCK_ADJUSTED` — Manual inventory replenishment or deduction.
- `PRODUCT_DELETED` — Product soft-deleted or removed.
- `CATEGORY_MUTATED` / `BRAND_MUTATED` — Taxonomy alterations.

### 4. Orders & Fulfillment (`ORDER`)
- `ORDER_PLACED` — Customer completed checkout.
- `ORDER_STATUS_CHANGED` — Transitioned (e.g., `PENDING` -> `CONFIRMED` -> `SHIPPED` -> `DELIVERED`).
- `ORDER_CANCELLED` — Cancelled by customer or admin with stock release.
- `PAYMENT_RECORDED` — Payment authorized or verified.

### 5. Promotions & Discounts (`MARKETING`)
- `COUPON_CREATED` — New promotion code added.
- `COUPON_APPLIED` — Coupon redeemed during checkout.
- `COUPON_EXPIRED` / `COUPON_DEACTIVATED` — Promo disabled.

---

## 6. Spring Boot Backend Architecture & Implementation

### 6.1 JPA Auditing Setup (`AuditorAware`)

Create `SecurityAuditorAware.java` so Spring Data JPA automatically knows the logged-in user:

```java
package com.cosmetics.ecommerce.security;

import com.cosmetics.ecommerce.entity.User;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class SecurityAuditorAware implements AuditorAware<String> {

    @Override
    public Optional<String> getCurrentAuditor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return Optional.of("SYSTEM");
        }
        if (auth.getPrincipal() instanceof User user) {
            return Optional.of(user.getEmail());
        }
        return Optional.of(auth.getName());
    }
}
```

---

### 6.2 AuditLog Entity Specification

File: `com/cosmetics/ecommerce/entity/AuditLog.java`

```java
package com.cosmetics.ecommerce.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.Instant;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_timestamp", columnList = "timestamp"),
    @Index(name = "idx_audit_actor", columnList = "actorEmail"),
    @Index(name = "idx_audit_entity", columnList = "entityName, entityId"),
    @Index(name = "idx_audit_action", columnList = "action")
})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant timestamp;

    private Long actorId;

    @Column(nullable = false, length = 190)
    private String actorEmail = "SYSTEM";

    @Column(nullable = false, length = 50)
    private String actorRole = "SYSTEM";

    @Column(nullable = false, length = 100)
    private String action;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(nullable = false, length = 100)
    private String entityName;

    @Column(length = 100)
    private String entityId;

    @Column(columnDefinition = "JSON")
    private String oldValue;

    @Column(columnDefinition = "JSON")
    private String newValue;

    @Column(length = 45)
    private String ipAddress;

    @Column(length = 255)
    private String userAgent;

    @Column(nullable = false, length = 20)
    private String status = "SUCCESS";

    @Column(columnDefinition = "TEXT")
    private String details;

    public AuditLog() {}

    // Builder / Factory method helper
    public static AuditLog create(String category, String action, String entityName, String entityId) {
        AuditLog log = new AuditLog();
        log.category = category;
        log.action = action;
        log.entityName = entityName;
        log.entityId = entityId;
        return log;
    }

    // Getters and Setters (Omitted for brevity)
    public Long getId() { return id; }
    public Instant getTimestamp() { return timestamp; }
    public String getAction() { return action; }
    public String getCategory() { return category; }
    public String getEntityName() { return entityName; }
    public String getEntityId() { return entityId; }
    public String getActorEmail() { return actorEmail; }
    public String getActorRole() { return actorRole; }
    public String getStatus() { return status; }
    public String getDetails() { return details; }
    public String getOldValue() { return oldValue; }
    public String getNewValue() { return newValue; }
    public String getIpAddress() { return ipAddress; }
    public String getUserAgent() { return userAgent; }

    public void setActorId(Long actorId) { this.actorId = actorId; }
    public void setActorEmail(String actorEmail) { this.actorEmail = actorEmail; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }
    public void setAction(String action) { this.action = action; }
    public void setCategory(String category) { this.category = category; }
    public void setEntityName(String entityName) { this.entityName = entityName; }
    public void setEntityId(String entityId) { this.entityId = entityId; }
    public void setOldValue(String oldValue) { this.oldValue = oldValue; }
    public void setNewValue(String newValue) { this.newValue = newValue; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    public void setStatus(String status) { this.status = status; }
    public void setDetails(String details) { this.details = details; }
}
```

---

### 6.3 Asynchronous Audit Logger Service

To ensure user response times remain fast, write audit records asynchronously in an isolated transaction:

```java
package com.cosmetics.ecommerce.service;

import com.cosmetics.ecommerce.entity.AuditLog;
import com.cosmetics.ecommerce.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);
    private final AuditLogRepository repository;

    public AuditLogService(AuditLogRepository repository) {
        this.repository = repository;
    }

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(AuditLog auditLog) {
        try {
            repository.save(auditLog);
            log.debug("Audit record logged: [{}] {} on {}:{}", 
                auditLog.getCategory(), auditLog.getAction(), 
                auditLog.getEntityName(), auditLog.getEntityId());
        } catch (Exception ex) {
            log.error("Failed to persist audit log: {}", ex.getMessage(), ex);
        }
    }
}
```

---

### 6.4 Spring AOP Interceptor / Event Publishing

Use Spring AOP or Spring Application Events (`ApplicationEventPublisher`) to intercept critical method executions without polluting business logic:

```java
@Aspect
@Component
public class OrderAuditAspect {

    private final AuditLogService auditLogService;

    public OrderAuditAspect(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @AfterReturning(
        pointcut = "execution(* com.cosmetics.ecommerce.service.OrderService.updateStatus(..)) && args(orderId, status)",
        returning = "result"
    )
    public void auditOrderStatusUpdate(Long orderId, OrderStatus status, Object result) {
        AuditLog log = AuditLog.create("ORDER", "ORDER_STATUS_CHANGED", "Order", String.valueOf(orderId));
        log.setDetails("Order status transitioned to: " + status.name());
        auditLogService.record(log);
    }
}
```

---

## 7. Admin REST API Specifications

Only users with `ROLE_ADMIN` are authorized to query audit logs.

### 1. List Audit Logs (Paginated & Filtered)
- **Endpoint**: `GET /api/admin/audit-logs`
- **Security**: `@PreAuthorize("hasRole('ADMIN')")`
- **Query Parameters**:
  - `page` (default: 0)
  - `size` (default: 20, max: 100)
  - `category` (optional, e.g. `ORDER`, `CATALOG`, `AUTH`)
  - `action` (optional, e.g. `PRODUCT_PRICE_CHANGED`)
  - `actorEmail` (optional)
  - `entityName` (optional)
  - `startDate` (ISO-8601 UTC timestamp)
  - `endDate` (ISO-8601 UTC timestamp)

#### Sample Response:
```json
{
  "success": true,
  "message": "Audit logs retrieved successfully.",
  "data": {
    "content": [
      {
        "id": 1042,
        "timestamp": "2026-10-22T14:30:15.120Z",
        "actorId": 1,
        "actorEmail": "admin@cosmetics.local",
        "actorRole": "ADMIN",
        "action": "ORDER_STATUS_CHANGED",
        "category": "ORDER",
        "entityName": "Order",
        "entityId": "502",
        "oldValue": "{\"status\":\"CONFIRMED\"}",
        "newValue": "{\"status\":\"SHIPPED\"}",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "status": "SUCCESS",
        "details": "Order marked as dispatched."
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1,
    "first": true,
    "last": true
  }
}
```

### 2. Export Audit Logs (CSV / JSON)
- **Endpoint**: `GET /api/admin/audit-logs/export?format=csv`
- **Response**: Streamed `text/csv` for external compliance archival.

---

## 8. Frontend Admin Dashboard Integration

In `artifacts/mybeautify-store/src/pages/admin/AdminPage.tsx`:

1. **Navigation Tab**:
   - Add `"audit"` tab in `AdminTabs`:
     ```tsx
     {(['products', 'categories', 'brands', 'audit'] as const).map((item) => (
       <button key={item} className={`admin-tab ${section === item ? 'active' : ''}`} ...>
         {item === 'audit' ? 'Audit Trail' : item[0].toUpperCase() + item.slice(1)}
       </button>
     ))}
     ```

2. **Audit Viewer Table**:
   - Columns: `Timestamp`, `Actor`, `Category`, `Action`, `Entity`, `Status`, `Inspect`.
   - **Inspect Modal**: Side drawer or modal showing the `oldValue` vs `newValue` JSON diff.

---

## 9. Security, Privacy (PII) & Immutability Rules

### 1. Zero Modification / Append-Only Guarantee
- The `audit_logs` table must be **Append-Only**.
- No `UPDATE` or `DELETE` endpoints must ever exist for audit logs.
- In database permission grants:
  ```sql
  -- Restrict regular application user from modifying audit records:
  GRANT INSERT, SELECT ON cosmetics_ecommerce.audit_logs TO 'Beautify'@'localhost';
  REVOKE UPDATE, DELETE, DROP ON cosmetics_ecommerce.audit_logs FROM 'Beautify'@'localhost';
  ```

### 2. Data Sanitization & PII Masking
- **Never Log Secrets**:
  - Passwords (raw or hashed)
  - JWT Tokens
  - Credit Card / CVV information
  - OTPs or verification codes
- **Mask Sensitive Information**:
  - Mask emails in public logs: `m***a@example.com`
  - Strip full billing address tokens from diff payloads.

---

## 10. Data Retention & Performance Optimization

| Timeline | Action & Strategy |
| :--- | :--- |
| **0 – 90 Days** | Stored in active MySQL `audit_logs` table with hot indexes for fast admin querying. |
| **90 – 365 Days** | Monthly scheduled Spring Boot job archives entries older than 90 days to compressed Parquet or S3/Cold storage. |
| **Partitioning** | For large-scale production, partition the `audit_logs` table by range on `timestamp` (Monthly partitions). |

---

## 🚀 Quick Verification & Test Checklist

- [ ] `@EnableJpaAuditing` is active in `CosmeticsEcommerceApplication`.
- [ ] Database migration or table creation executed for `audit_logs`.
- [ ] `SecurityAuditorAware` captures authenticated user email from `SecurityContext`.
- [ ] Audit logs can be queried via `GET /api/admin/audit-logs`.
- [ ] Only authorized roles (`ADMIN`) have access.
- [ ] Diffs correctly capture state transitions without exposing passwords.

---

*Document generated for MyBeautify E-Commerce Store Architecture & Governance.*

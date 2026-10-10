SnapShare Photo-App Scaling Plan

1. Assumptions

* SnapShare has 10 million registered users.
* 10% of registered users are active each day.
* Each daily active user uploads 1 photo per day.
* Each daily active user views 50 feed pages per day.
* Each original photo is 2 MB.
* Each thumbnail is 50 KB.
* There are 86,400 seconds in a day.
* Traffic is not evenly distributed, so peak traffic will be higher than average traffic.
* Original photos and thumbnails are stored in object storage, while metadata is stored in a database.

2. Daily Active Users

Daily active users (DAU) are calculated as follows:

10,000,000 × 10% = 1,000,000 daily active users

SnapShare is expected to have approximately one million active users per day.

3. Uploads Per Day

Each daily active user uploads one photo per day.

1,000,000 × 1 = 1,000,000 photo uploads per day

Average uploads per second:

1,000,000 ÷ 86,400 = approximately 11.57 uploads per second

The system must support higher peak upload traffic than the daily average.

4. Feed Reads Per Second

Each daily active user views 50 feed pages per day.

1,000,000 × 50 = 50,000,000 feed-page requests per day

Average feed reads per second:

50,000,000 ÷ 86,400 = approximately 579 reads per second

Actual peak traffic may be several times higher, especially during popular events or busy periods.

5. Photo Storage Per Day

Each original photo is 2 MB.

1,000,000 × 2 MB = 2,000,000 MB, or approximately 2 TB per day.

Each thumbnail is 50 KB.

1,000,000 × 50 KB = 50,000,000 KB, or approximately 50 GB per day.

Combined daily storage growth:

2 TB + 50 GB = approximately 2.05 TB per day.

These estimates use decimal storage units and exclude replication, backups, metadata, and storage overhead.

6. Photo Storage Per Year

Original photo storage per year:

2 TB × 365 = 730 TB per year.

Thumbnail storage per year:

50 GB × 365 = 18.25 TB per year.

Combined annual storage growth:

730 TB + 18.25 TB = approximately 748.25 TB per year.

Actual storage requirements will depend on compression, retention policies, backups, replication, and deleted-photo handling.

7. High-Level Architecture

flowchart TD
    U[User / Mobile App] --> LB[Load Balancer]
    LB --> A1[Application Server 1]
    LB --> A2[Application Server 2]
    A1 --> C[Distributed Cache]
    A2 --> C
    A1 --> DB[(Primary Database)]
    A2 --> DB
    DB --> RR[(Read Replica)]
    A1 --> OS[Object Storage]
    A2 --> OS
    A1 --> Q[Message Queue]
    A2 --> Q
    Q --> W[Thumbnail Worker]
    W --> OS
    W --> DB
    U --> CDN[Content Delivery Network]
    CDN --> OS

Component Responsibilities

* User / mobile app: Allows users to upload photos and view feeds.
* Load balancer: Distributes incoming application requests across healthy application servers.
* Application servers: Authenticate users, validate uploads, manage photo metadata, and handle API requests.
* Distributed cache: Stores frequently requested feed information to reduce database load and improve response times.
* Primary database: Stores photo metadata, user information, ownership, and storage keys.
* Read replica: Handles suitable read queries to reduce the workload on the primary database.
* Object storage: Stores original photos and generated thumbnails separately from the database.
* Message queue: Holds thumbnail-generation jobs so uploads do not have to wait for image processing.
* Thumbnail worker: Processes queued jobs, generates thumbnails, stores them, and updates processing status.
* Content Delivery Network (CDN): Caches and delivers photos from locations closer to users, reducing latency and origin-server traffic.

8. Photo Upload Flow

1. User submits a photo: The user selects a photo in the SnapShare app and submits it for upload.
2. Load balancing: The request reaches the load balancer, which forwards it to a healthy application server.
3. Authentication and validation: The application server authenticates the user and validates the photo’s file type, size, and upload permissions.
4. Store the original photo: The application uploads the original photo to object storage, which returns a storage key or path.
5. Save photo metadata: The application saves the photo’s metadata, owner, storage location, and processing status in the database.
6. Queue thumbnail generation: The application places a thumbnail-generation job on the message queue. It confirms the original upload once the original photo and its metadata have been stored successfully, without waiting for thumbnail generation to finish.
7. Generate and store the thumbnail: A background worker retrieves the job, downloads the original photo from object storage, generates a 50 KB thumbnail, and saves it to object storage. The worker updates the photo metadata to indicate that the thumbnail is ready. Failed jobs can be retried.
8. Display the photo in feeds: When users scroll their feeds, the application retrieves feed information from the cache or database. The CDN delivers thumbnails for feed previews, while the original photo is loaded when needed. If thumbnail generation is still pending, the feed displays a placeholder until the thumbnail becomes available.

9. Architecture Trade-Offs

Trade-Off 1: Eventual Consistency in Feed Views vs Cache Invalidation Complexity

Description

Eventual consistency means that updates to the database may not appear immediately in every cached feed. After a user uploads a photo, the database can contain the new photo before all relevant cached feeds have been refreshed.

Benefits

* Improved read performance: Cached feeds can be served quickly without querying the database for every request.
* Reduced database load: The system avoids refreshing every cached feed immediately after each upload.
* Better scalability: The application can support large numbers of feed requests by using cached data.
* Lower latency: Users can receive feed responses faster because frequently requested information is already cached.

Costs

* Stale feed information: Some users may temporarily see an older feed that does not include a newly uploaded photo.
* Cache invalidation complexity: The application must determine which cached feeds or entries need to be updated or invalidated.
* Additional consistency logic: The system must manage cache expiration, refreshes, and possible inconsistencies between cached data and the database.
* Potential user confusion: Users may think their upload failed if the photo does not immediately appear in every feed.

Decision

SnapShare will use eventual consistency for feed views to prioritise responsiveness and scalability. After a photo is saved, the application will update or invalidate relevant cache entries where practical. Cached feeds may briefly lag behind the database, but the application will prioritise keeping feeds responsive. Users can refresh their feeds if a recent photo is not immediately visible.

Trade-Off 2: Asynchronous Worker Queue vs Synchronous Thumbnail Processing

Description

Asynchronous processing places thumbnail-generation jobs on a message queue so that background workers can process them independently of the user’s upload request.

Synchronous processing generates the thumbnail during the upload request and waits for processing to finish before confirming the upload.

Option A: Asynchronous Thumbnail Generation

Benefits

* Faster uploads: Users do not have to wait for thumbnail generation to finish before receiving upload confirmation.
* Independent scalability: Background workers can be scaled separately from application servers to handle increases in image-processing demand.
* Improved resilience: Failed jobs can be retried without requiring users to upload their photos again.
* Better resource management: Thumbnail processing is separated from application servers handling user requests.
* Smoother traffic handling: A durable queue can hold jobs temporarily when demand exceeds the workers’ processing capacity.

Costs

* Delayed thumbnail availability: A thumbnail may not be available immediately after the original photo is uploaded.
* Additional infrastructure: The system requires a message queue and background workers.
* Operational complexity: The team must monitor queue depth, processing delays, failed jobs, and worker health.
* Duplicate processing risk: A job may be processed more than once after a retry, so workers must handle duplicate jobs safely.
* More complex status management: The application must track whether a thumbnail is pending, ready, or has failed.

Option B: Synchronous Thumbnail Generation

Benefits

* Immediate thumbnail availability: The thumbnail is ready when the upload request completes successfully.
* Simpler architecture: A separate message queue and background worker system are not required.
* Straightforward error reporting: Thumbnail-generation errors can be returned directly as part of the upload response.
* Simpler processing flow: The original photo, thumbnail, and metadata can be handled within one request flow.

Costs

* Slower uploads: Users must wait for thumbnail generation before receiving confirmation.
* Reduced scalability: Image processing consumes application-server resources and can reduce the number of requests handled simultaneously.
* Higher timeout risk: Heavy traffic or slow image processing can cause requests to time out.
* Tighter coupling: A thumbnail-processing failure can affect the overall upload request.
* Less efficient resource use: Application servers may spend more time processing images instead of responding to other users.

Decision

SnapShare will use asynchronous thumbnail generation through a durable message queue and background workers. Although this approach introduces additional infrastructure and means thumbnails may appear with a short delay, it improves upload responsiveness and allows image processing to scale independently.

The application will confirm the original upload once the original photo and its metadata have been stored successfully. While thumbnail generation is pending, the feed will display a placeholder. Failed jobs will be retried, duplicate processing will be handled safely, and persistent failures will be monitored for investigation.

10. Reliability and Avoiding Single Points of Failure

* Multiple application servers: Run at least two application servers and distribute them across separate availability zones where possible.
* Load-balancer health checks: Remove unhealthy application servers from rotation automatically.
* Database availability: Use a highly available database configuration with replication and a tested failover procedure.
* Regular backups: Back up the database and test restoration procedures.
* Durable message queue: Ensure queued thumbnail jobs are not lost during temporary failures.
* Retry handling: Retry failed thumbnail jobs and monitor persistent failures.
* Idempotent workers: Design workers so that processing a duplicate job does not create inconsistent metadata or unnecessary duplicate records.
* Cache resilience: Use redundant cache infrastructure and allow the application to fall back to the database when the cache is unavailable.
* Monitoring: Track API latency, error rates, upload failures, queue depth, thumbnail-processing time, and storage usage.
* Security: Apply authentication, authorisation, upload-size limits, and appropriate access controls. Use signed or short-lived URLs where appropriate to protect private photos.
* Rate limiting: Restrict excessive requests and uploads to help prevent abuse and protect service capacity.

11. Conclusion

SnapShare is expected to support approximately one million photo uploads and 50 million feed-page requests per day. This represents an average of about 11.57 uploads per second and 579 feed reads per second. Original photos and thumbnails add approximately 2.05 TB of storage per day under the stated assumptions.

A scalable design uses a load balancer, multiple application servers, a distributed cache, a primary database with a read replica, object storage, a CDN, a durable message queue, and asynchronous thumbnail workers.

The design makes two important trade-offs. Eventual consistency improves feed performance but requires careful cache invalidation and allows temporary stale data. Asynchronous thumbnail generation improves upload responsiveness and independent scalability but introduces processing delays and additional infrastructure.

These trade-offs are acceptable for SnapShare because feed responsiveness and reliable handling of high upload volumes are priorities. Cache management, placeholders, retry handling, monitoring, and redundant infrastructure help manage the associated risks.
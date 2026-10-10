SnapShare Photo-App Scaling Plan

1. Assumptions

* SnapShare has 10 million registered users.
* 10% of registered users are active each day.
* Each daily active user uploads 1 photo per day and views 50 feed pages per day.
* Each original photo is 2 MB, and each thumbnail is 50 KB.
* There are 86,400 seconds in a day.
* Traffic is not evenly distributed, so peak traffic will be higher than average traffic.
* Photos are stored in object storage, while photo metadata is stored in a database.

2. Daily Active Users

Daily active users (DAU) are calculated as:

10,000,000 × 10% = 1,000,000 daily active users

SnapShare is therefore expected to have approximately one million active users per day.

3. Uploads Per Day

Each daily active user uploads one photo per day.

1,000,000 × 1 = 1,000,000 photo uploads per day

Average uploads per second:

1,000,000 ÷ 86,400 ≈ 11.57 uploads per second

The system should support higher peak upload traffic than this average.

4. Feed Reads Per Second

Each daily active user views 50 feed pages per day.

1,000,000 × 50 = 50,000,000 feed-page requests per day

Average feed reads per second:

50,000,000 ÷ 86,400 ≈ 579 reads per second

This is the average rate. Actual peak traffic may be several times higher, especially during popular events or busy periods.

5. Photo Storage Per Day

Each original photo is 2 MB.

1,000,000 × 2 MB = 2,000,000 MB per day, or approximately 2 TB per day using decimal units.

Each thumbnail is 50 KB.

1,000,000 × 50 KB = 50,000,000 KB per day, or approximately 50 GB per day using decimal units.

Combined original and thumbnail storage growth:

2 TB + 50 GB = approximately 2.05 TB per day.

6. Photo Storage Per Year

Original photo storage per year:

2 TB × 365 = 730 TB per year.

Thumbnail storage per year:

50 GB × 365 = 18.25 TB per year.

Combined annual storage growth:

730 TB + 18.25 TB = approximately 748.25 TB per year.

These estimates exclude replication, backups, metadata, storage overhead, and deleted-photo retention. Actual storage requirements will depend on photo retention policies and compression.

7. High-Level Architecture

flowchart TD
    U[User / Mobile App] --> DNS[DNS]
    DNS --> CDN[Content Delivery Network]
    CDN --> LB[Load Balancer]
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

Component Responsibilities

* User / mobile app: Allows users to upload photos and view feeds.
* DNS: Resolves the application’s domain name.
* CDN: Delivers cached thumbnails and original photos from locations closer to users.
* Load balancer: Distributes API requests across healthy application servers.
* Application servers: Authenticate users, validate uploads, manage photo metadata, and process API requests.
* Distributed cache: Stores frequently requested feed information to reduce database load and improve response times.
* Primary database: Stores photo metadata, user information, ownership, and storage keys.
* Read replica: Handles suitable read queries to reduce load on the primary database.
* Object storage: Stores original photos and generated thumbnails separately from the relational database.
* Message queue: Holds thumbnail-generation jobs so uploads do not have to wait for image processing.
* Thumbnail worker: Processes queued jobs, generates thumbnails, stores them, and updates processing status.

8. Photo Upload Flow

1. User submits a photo: The user selects a photo in the SnapShare app and submits it for upload.
2. Load balancing: The request reaches the load balancer, which forwards it to a healthy application server.
3. Authentication and validation: The application server authenticates the user and validates the photo’s file type, size, and upload permissions.
4. Store the original photo: The application uploads the original photo to object storage, which returns a storage key or path.
5. Save photo metadata: The application saves the photo’s metadata, owner, and storage location in the database.
6. Queue thumbnail generation: The application places a thumbnail-generation job on the message queue and confirms the original upload without waiting for thumbnail generation to finish.
7. Generate and store the thumbnail: A background worker retrieves the job, downloads the original photo from object storage, creates a 50 KB thumbnail, and saves it back to object storage. The worker updates the photo metadata to indicate that the thumbnail is ready. Failed jobs can be retried.
8. Display the photo in feeds: When users scroll their feeds, the application retrieves feed information from the cache or database. The CDN delivers thumbnails for feed previews, while the original photo is loaded when needed. If thumbnail generation is still pending, the feed displays a placeholder until the thumbnail becomes available.

9. Architecture Trade-Offs

Trade-off 1: Eventual Consistency in Feed Views vs Cache Invalidation Complexity

Benefit: Allowing feed views to update eventually reduces the need to refresh every cached feed immediately after a photo is uploaded. This improves read performance and reduces database load when many users view feeds.

Cost: Some users may temporarily see stale feed information or may not immediately see a newly uploaded photo. Cache invalidation becomes more complex because the system must determine which cached feeds or entries need to be refreshed.

Decision: SnapShare will use eventual consistency for feed views. After a photo is saved, the system will update or invalidate relevant cache entries where practical. Cached feeds may briefly lag behind the database, while the application prioritises keeping the feed responsive. Users can refresh if a recent photo is not immediately visible.

Trade-off 2: Asynchronous Thumbnail Generation vs Immediate Photo Availability

Benefit: Processing thumbnails in a background worker allows the upload request to finish without waiting for image processing. This improves upload responsiveness and lets the system handle thumbnail jobs independently as demand increases.

Cost: A thumbnail may not be available immediately after the original photo is uploaded. Queue delays or worker failures can leave the photo temporarily without a thumbnail, and the system must support retries and monitor failed jobs.

Decision: SnapShare will generate thumbnails asynchronously using a message queue and background workers. The application will confirm the original upload once the original photo and its metadata have been stored successfully. While the thumbnail is pending, the feed will show a placeholder. Failed jobs will be retried, and persistent failures will be monitored for investigation.

10. Reliability and Avoiding Single Points of Failure

* Run at least two application servers and distribute them across separate availability zones where possible.
* Use health checks so the load balancer removes unhealthy application servers from rotation.
* Use a highly available database configuration with replication and a tested failover procedure.
* Back up the database regularly and test restoration procedures.
* Use durable message queues and retry failed thumbnail-generation jobs.
* Make background jobs safe to retry so a duplicate job does not create inconsistent metadata.
* Use redundant cache infrastructure and ensure the application can fall back to the database if the cache becomes unavailable.
* Monitor API latency, error rates, upload failures, queue depth, thumbnail-processing time, and storage usage.
* Use access controls and short-lived or signed URLs where appropriate to protect private photos.
* Apply rate limits and upload-size limits to help prevent abuse and protect service capacity.

11. Conclusion

SnapShare’s estimated workload is approximately one million photo uploads per day and 50 million feed-page requests per day. This represents about 11.57 uploads per second and 579 feed reads per second on average. Original photos and thumbnails add approximately 2.05 TB of storage per day under the stated assumptions.

A scalable design uses multiple application servers, a load balancer, a distributed cache, a primary database with a read replica, object storage, a CDN, and asynchronous thumbnail workers. Eventual consistency and background processing improve responsiveness and scalability but introduce trade-offs that must be managed through cache invalidation, placeholders, retries, monitoring, and reliable storage.
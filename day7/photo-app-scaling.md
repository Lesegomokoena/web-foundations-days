SnapShare Photo-App Scaling Plan

1. Assumptions

* SnapShare has 10 million registered users.
* 10% of registered users are active each day.
* Each daily active user uploads 1 photo per day and views 50 feed pages per day.
* Each original photo is 2 MB, and each thumbnail is 50 KB.
* A day has 86,400 seconds, and a year has 365 days.
* Average rates are calculated over 24 hours. Peak feed traffic is estimated at 5 times the average rate.
* For storage estimates, I assume every uploaded photo and its thumbnail are retained for a year. I exclude backups, replicas, videos and other metadata from the storage calculation.

2. Traffic and Storage Calculations

Daily active users

Daily active users = 10,000,000 × 10%

Daily active users = 1,000,000

Uploads per second

Each active user uploads 1 photo per day.

Daily uploads = 1,000,000 × 1 = 1,000,000 photos

Uploads per second = 1,000,000 ÷ 86,400

Average uploads per second ≈ 11.6 photos/second

Feed views per second

Each active user views 50 feed pages per day.

Daily feed views = 1,000,000 × 50 = 50,000,000 feed pages

Average feed views per second = 50,000,000 ÷ 86,400

Average feed views per second ≈ 579

Peak feed views per second = 579 × 5

Estimated peak feed views per second ≈ 2,894

Photo storage per year

Original photo size = 2 MB

Thumbnail size = 50 KB = 0.05 MB

Combined storage per photo, including its thumbnail = 2 + 0.05 = 2.05 MB

Annual uploads = 1,000,000 × 365 = 365,000,000 photos

Original photo storage per year = 365,000,000 × 2 MB = 730,000,000 MB

Thumbnail storage per year = 365,000,000 × 0.05 MB = 18,250,000 MB

Total storage per year = 365,000,000 × 2.05 MB = 748,250,000 MB

Using decimal units, where 1,000 MB = 1 GB and 1,000 GB = 1 TB:

Total new photo and thumbnail storage ≈ 748.25 TB per year.

This is the storage for one year of new uploads before replication, backups or extra copies. If photos are retained across multiple years, total storage will continue to grow.

3. Is SnapShare Read-Heavy or Write-Heavy?

SnapShare is read-heavy because users view about 50 million feed pages per day, while they upload about 1 million photos per day. Feed views greatly outnumber uploads.

The design should therefore optimise reading by using a CDN for photo delivery, a cache for frequently requested feed data, and a database read replica for read queries. Uploads should still be reliable, and thumbnail generation should happen asynchronously so that uploading a photo does not have to wait for the thumbnail to be created.

4. Why Photos Should Not Be Stored Inside the Database

Photo files are large binary objects. Storing them directly in the database would increase database size, backups and restore times, and could make database operations more expensive. Instead, original photos and thumbnails should be stored in object storage, which is designed to store and serve large files reliably. The database should store photo metadata, such as the photo ID, owner, upload time and object-storage location.

5. Architecture Diagram

                         USERS
                           |
                           v
                         [CDN]
                    (cached photos)
                           |
                           v
                    [Load Balancer]
                           |
               +-----------+-----------+
               |           |           |
               v           v           v
          [App Server] [App Server] [App Server]
               |           |           |
               +-----------+-----------+
                           |
               +-----------+-----------+
               |           |           |
               v           v           v
            [Cache]   [Database]  [Object Storage]
                          |         (original photos
                          v          and thumbnails)
                    [Read Replica]
                           
          Upload processing:
          [App Servers] ---> [Queue] ---> [Thumbnail Worker]
                                             |
                                             v
                                       [Object Storage]

6. What Each Component Does

* CDN: Delivers cached photos from locations closer to users, reducing loading time and traffic reaching the main servers.
* Load balancer: Distributes incoming requests across app servers so that no single server handles all the traffic.
* App servers: Handle application logic, authenticate users, process upload requests and prepare feed responses.
* Cache: Keeps frequently requested feed data and metadata in fast memory to reduce repeated database queries.
* Database: Stores structured information such as users, follows, photo metadata and feed-related records.
* Database read replica: Handles eligible read queries separately from the primary database to reduce read pressure on the primary.
* Object storage: Stores original photos and generated thumbnails without filling the relational database with large image files.
* Queue: Holds thumbnail-generation jobs so they can be processed reliably in the background rather than delaying the upload response.
* Thumbnail worker: Reads jobs from the queue, creates smaller thumbnail versions and saves them to object storage.

7. Photo Upload Flow

1. A user selects a photo and submits it through the SnapShare app.
2. The request reaches the load balancer, which directs it to an available app server.
3. The app server authenticates the user and validates the upload, including the file type and size.
4. The original photo is uploaded to object storage, where it receives a storage key or path.
5. The app server saves the photo’s metadata and storage location in the database.
6. The app server places a thumbnail-generation job on the queue.
7. The app confirms that the original photo has been uploaded successfully without waiting for thumbnail generation to finish.
8. A thumbnail worker takes the job from the queue, retrieves the original photo and creates a 50 KB thumbnail.
9. The worker saves the thumbnail in object storage and updates the photo metadata if needed to indicate that the thumbnail is ready.
10. When users scroll their feeds, the app retrieves feed information from the cache or database and serves photo files through the CDN. The thumbnail is used for feed previews, while the original can be loaded when needed.

8. Trade-Offs

Trade-off 1: Cache speed vs freshness

Caching feed data improves response times and reduces database load. However, cached data may become outdated when someone uploads a photo or changes who they follow. SnapShare needs a cache-expiration or invalidation strategy to keep feeds reasonably fresh.

Trade-off 2: Asynchronous thumbnails vs immediate availability

Using a queue and background worker makes uploads faster and allows thumbnail processing to scale independently. However, a thumbnail may not be available immediately after upload, so the app should show a placeholder or the original image until processing finishes.

Trade-off 3: Read replica performance vs consistency

A read replica helps handle more read traffic, but replication can lag behind the primary database. A newly uploaded photo might not appear immediately in queries served by the replica. The app can use the primary for critical immediate reads and the replica for less time-sensitive reads.

Trade-off 4: Object storage cost vs redundancy

Object storage is suitable for large photo files and scales separately from the database, but storing hundreds of terabytes each year costs money. Replication, backups and retention policies improve durability but increase storage costs.
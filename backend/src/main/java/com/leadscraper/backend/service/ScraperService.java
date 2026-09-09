package com.leadscraper.backend.service;

import com.leadscraper.backend.dto.scraper.OverturePlace;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ScraperService {

    private static final String OVERTURE_PATH = "s3://overturemaps-us-west-2/release/2026-07-22.0/theme=places/type=place/*";

    private final LocationResolverService locationResolverService;

    public ScraperService(LocationResolverService locationResolverService) {
        this.locationResolverService = locationResolverService;
    }

    public List<OverturePlace> searchPlaces(
            String keyword,
            String location,
            int maxLeads) throws Exception {

        LocationResolverService.LocationResult resolvedLocation = locationResolverService.resolve(location);

        String[] boundingBox = resolvedLocation.boundingbox();

        if (boundingBox == null || boundingBox.length != 4) {
            throw new IllegalArgumentException(
                    "Invalid bounding box returned for location: " + location);
        }

        double south = Double.parseDouble(boundingBox[0]);
        double north = Double.parseDouble(boundingBox[1]);
        double west = Double.parseDouble(boundingBox[2]);
        double east = Double.parseDouble(boundingBox[3]);

        String sql = """
                SELECT
                    names.primary AS name,
                    websites[1] AS website,
                    phones[1] AS phone,
                    emails[1] AS email,
                    addresses[1].freeform AS address,
                    addresses[1].locality AS city,
                    addresses[1].region AS state,
                    addresses[1].country AS country,
                    confidence
                FROM read_parquet(
                    '%s',
                    hive_partitioning = 1
                )
                WHERE
                    bbox.xmin <= ?
                    AND bbox.xmax >= ?
                    AND bbox.ymin <= ?
                    AND bbox.ymax >= ?
                    AND (
                        lower(names.primary) LIKE ?
                        OR lower(categories.primary) LIKE ?
                    )
                ORDER BY confidence DESC
                LIMIT ?
                """.formatted(OVERTURE_PATH);

        Map<String, OverturePlace> uniquePlaces = new LinkedHashMap<>();

        try (Connection connection = DriverManager.getConnection("jdbc:duckdb:");
                PreparedStatement statement = connection.prepareStatement(sql)) {

            String searchPattern = "%" + keyword.trim().toLowerCase() + "%";

            statement.setDouble(1, east);
            statement.setDouble(2, west);
            statement.setDouble(3, north);
            statement.setDouble(4, south);

            statement.setString(5, searchPattern);
            statement.setString(6, searchPattern);
            statement.setInt(7, maxLeads);

            try (ResultSet resultSet = statement.executeQuery()) {

                while (resultSet.next()) {

                    String name = resultSet.getString("name");

                    if (name == null || name.isBlank()) {
                        continue;
                    }

                    OverturePlace place = new OverturePlace(
                            name,
                            resultSet.getString("website"),
                            resultSet.getString("phone"),
                            resultSet.getString("email"),
                            resultSet.getString("address"),
                            resultSet.getString("city"),
                            resultSet.getString("state"),
                            resultSet.getString("country"),
                            resultSet.getDouble("confidence"));

                    String key = place.name()
                            .trim()
                            .toLowerCase();

                    uniquePlaces.merge(
                            key,
                            place,
                            (existing, incoming) -> incoming.confidence() > existing.confidence()
                                    ? incoming
                                    : existing);
                }
            }
        }

        return new ArrayList<>(uniquePlaces.values());
    }

    public ScrapedPage scrapePage(String url) throws Exception {

        org.jsoup.nodes.Document document = org.jsoup.Jsoup.connect(url)
                .userAgent("Mozilla/5.0")
                .timeout(10_000)
                .get();

        String title = document.title();

        String description = document
                .select("meta[name=description]")
                .attr("content");

        return new ScrapedPage(
                title,
                url,
                description);
    }

    public record ScrapedPage(
            String title,
            String url,
            String description) {
    }
}
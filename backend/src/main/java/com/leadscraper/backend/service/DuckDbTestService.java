package com.leadscraper.backend.service;

import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

@Service
public class DuckDbTestService {

    public String testConnection() throws Exception {

        try (Connection connection =
                     DriverManager.getConnection("jdbc:duckdb:")) {

            return "DuckDB connection successful!";
        }
    }

    public String testOverture() throws Exception {

        try (Connection connection =
                     DriverManager.getConnection("jdbc:duckdb:")) {

            try (PreparedStatement statement = connection.prepareStatement("""
                    SELECT
                        names.primary AS name,
                        confidence
                    FROM read_parquet(
                        's3://overturemaps-us-west-2/release/2026-07-22.0/theme=places/type=place/*',
                        hive_partitioning = 1
                    )
                    WHERE
                        names.primary = 'Cybage Software'
                        AND bbox.xmin >= 73.75
                        AND bbox.xmax <= 73.95
                        AND bbox.ymin >= 18.45
                        AND bbox.ymax <= 18.65
                    LIMIT 1
                    """)) {

                try (ResultSet result = statement.executeQuery()) {

                    if (result.next()) {
                        return "Overture found: "
                                + result.getString("name")
                                + " | confidence = "
                                + result.getDouble("confidence");
                    }

                    return "Overture returned no result.";
                }
            }
        }
    }
}
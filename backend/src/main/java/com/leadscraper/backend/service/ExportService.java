package com.leadscraper.backend.service;

import com.leadscraper.backend.dto.employee.EmployeeLeadResponse;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExportService {

    public String generateCsv(List<EmployeeLeadResponse> leads) {
        StringBuilder csv = new StringBuilder();
        csv.append("Name,Job Title,Department,Seniority,Company,Website,Industry,City,State,Country,Work Email,Email Status,Phone,Professional URL,Decision Maker,Lead Status,Quality Score,Source,Source URL,Created At\n");

        if (leads == null || leads.isEmpty()) {
            return csv.toString();
        }

        for (EmployeeLeadResponse lead : leads) {
            csv.append(escape(lead.fullName())).append(",")
                    .append(escape(lead.jobTitle())).append(",")
                    .append(escape(lead.department())).append(",")
                    .append(escape(lead.seniority())).append(",")
                    .append(escape(lead.companyName())).append(",")
                    .append(escape(lead.companyWebsite())).append(",")
                    .append(escape(lead.industry())).append(",")
                    .append(escape(lead.city())).append(",")
                    .append(escape(lead.state())).append(",")
                    .append(escape(lead.country())).append(",")
                    .append(escape(lead.workEmail())).append(",")
                    .append(escape(lead.emailStatus())).append(",")
                    .append(escape(lead.phone())).append(",")
                    .append(escape(lead.professionalUrl())).append(",")
                    .append(lead.isDecisionMaker() == Boolean.TRUE ? "Yes" : "No").append(",")
                    .append(escape(lead.status())).append(",")
                    .append(lead.qualityScore() != null ? lead.qualityScore() : 0).append(",")
                    .append(escape(lead.source())).append(",")
                    .append(escape(lead.sourceUrl())).append(",")
                    .append(escape(lead.createdAt() != null ? lead.createdAt().toString() : "")).append("\n");
        }
        return csv.toString();
    }

    private String escape(String val) {
        if (val == null) return "";
        String clean = val.replace("\"", "\"\"");
        if (clean.contains(",") || clean.contains("\"") || clean.contains("\n")) {
            return "\"" + clean + "\"";
        }
        return clean;
    }
}

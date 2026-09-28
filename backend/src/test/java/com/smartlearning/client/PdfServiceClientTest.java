package com.smartlearning.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartlearning.dto.SearchResultDto;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class PdfServiceClientTest {
    @Test
    void selectsFullContextAndReadsSectionMetadataWithoutChangingPublicHit() throws Exception {
        RestTemplate rest = new RestTemplate();
        var server = MockRestServiceServer.createServer(rest);
        var client = new PdfServiceClient(rest);
        ReflectionTestUtils.setField(client, "baseUrl", "http://pdf");
        server.expect(requestTo("http://pdf/search/doc"))
                .andExpect(content().json("{\"query\":\"term\",\"top_k\":5,\"context\":true}"))
                .andRespond(withSuccess("{\"document_id\":\"doc\",\"hits\":[{\"text\":\"definition\",\"page\":2,\"score\":0.8}]}", MediaType.APPLICATION_JSON));
        assertEquals(2, client.context("doc", "term", 5).get(0).getPage());
        server.verify();
        server.reset();
        server.expect(requestTo("http://pdf/fulltext/doc"))
                .andRespond(withSuccess("{\"chunks\":[{\"text\":\"definition\",\"page\":2,\"score\":0,\"heading\":\"Chapter 1\",\"section_id\":\"7\"}]}", MediaType.APPLICATION_JSON));
        SearchResultDto hit = client.fullText("doc").get(0);
        assertEquals("Chapter 1", hit.getHeading());
        assertEquals("7", hit.getSectionId());
        var json = new ObjectMapper().valueToTree(hit);
        assertEquals(3, json.size());
        assertTrue(json.has("text") && json.has("page") && json.has("score"));
        server.verify();
    }
}

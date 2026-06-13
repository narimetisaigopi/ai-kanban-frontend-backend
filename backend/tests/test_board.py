async def test_get_board_requires_auth(client):
    resp = await client.get("/api/board")
    assert resp.status_code == 401


async def test_get_board(client, auth_headers):
    resp = await client.get("/api/board", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["columns"]) == 5
    assert body["columns"][0]["id"] == "col-backlog"
    assert len(body["columns"][0]["cardIds"]) == 3
    assert body["cards"]["card-1"]["title"] == "Research competitors"


async def test_rename_column(client, auth_headers):
    resp = await client.patch(
        "/api/columns/col-backlog",
        json={"title": "Ideas"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    column = next(c for c in resp.json()["columns"] if c["id"] == "col-backlog")
    assert column["title"] == "Ideas"


async def test_rename_column_not_found(client, auth_headers):
    resp = await client.patch(
        "/api/columns/missing", json={"title": "X"}, headers=auth_headers
    )
    assert resp.status_code == 404


async def test_add_card(client, auth_headers):
    resp = await client.post(
        "/api/columns/col-todo/cards",
        json={"title": "New task", "details": "Some details"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    todo = next(c for c in body["columns"] if c["id"] == "col-todo")
    assert len(todo["cardIds"]) == 3
    new_id = todo["cardIds"][-1]
    assert body["cards"][new_id]["title"] == "New task"


async def test_add_card_column_not_found(client, auth_headers):
    resp = await client.post(
        "/api/columns/missing/cards",
        json={"title": "x"},
        headers=auth_headers,
    )
    assert resp.status_code == 404


async def test_add_card_validation_error(client, auth_headers):
    resp = await client.post(
        "/api/columns/col-todo/cards",
        json={"title": ""},
        headers=auth_headers,
    )
    assert resp.status_code == 422


async def test_delete_card(client, auth_headers):
    resp = await client.delete("/api/cards/card-1", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert "card-1" not in body["cards"]
    backlog = next(c for c in body["columns"] if c["id"] == "col-backlog")
    assert backlog["cardIds"] == ["card-2", "card-3"]


async def test_delete_card_not_found(client, auth_headers):
    resp = await client.delete("/api/cards/missing", headers=auth_headers)
    assert resp.status_code == 404


async def test_move_card_same_column(client, auth_headers):
    resp = await client.post(
        "/api/cards/card-1/move",
        json={"to_column_id": "col-backlog", "to_index": 2},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    backlog = next(c for c in resp.json()["columns"] if c["id"] == "col-backlog")
    assert backlog["cardIds"] == ["card-2", "card-3", "card-1"]


async def test_move_card_cross_column(client, auth_headers):
    resp = await client.post(
        "/api/cards/card-1/move",
        json={"to_column_id": "col-done", "to_index": 0},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    backlog = next(c for c in body["columns"] if c["id"] == "col-backlog")
    done = next(c for c in body["columns"] if c["id"] == "col-done")
    assert backlog["cardIds"] == ["card-2", "card-3"]
    assert done["cardIds"][0] == "card-1"


async def test_move_card_index_beyond_length(client, auth_headers):
    resp = await client.post(
        "/api/cards/card-1/move",
        json={"to_column_id": "col-done", "to_index": 99},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    done = next(c for c in resp.json()["columns"] if c["id"] == "col-done")
    assert done["cardIds"][-1] == "card-1"


async def test_move_card_not_found(client, auth_headers):
    resp = await client.post(
        "/api/cards/missing/move",
        json={"to_column_id": "col-done", "to_index": 0},
        headers=auth_headers,
    )
    assert resp.status_code == 404


async def test_move_card_target_column_not_found(client, auth_headers):
    resp = await client.post(
        "/api/cards/card-1/move",
        json={"to_column_id": "missing", "to_index": 0},
        headers=auth_headers,
    )
    assert resp.status_code == 404

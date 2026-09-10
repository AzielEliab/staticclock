import assert from "node:assert/strict";
import test from "node:test";
import {
  MESH_DEFAULT_OFF,
  MESH_NODE_GATE,
  MESH_NOTE,
  MESH_ROUTE_METHODS,
  QNS_CD,
  QNS_CD_PUBLIC_PROXY,
  QNS_CD_SOFTWARES_TAB,
  QNS_CD_SPEC,
  attachQnsCd,
  emptyMesh,
  meshPointer,
  publicMesh,
} from "../src/mesh.js";

test("QNS-CD-1.0 cross-map is coded; mesh stays default off; no qnsd proxy", () => {
  assert.equal(QNS_CD_SPEC, "QNS-CD-1.0");
  assert.equal(QNS_CD.spec, "QNS-CD-1.0");
  assert.equal(QNS_CD.transfer, "photon QNS1 packet transfer");
  assert.equal(QNS_CD.local_qnsd, "https://github.com/AzielEliab/qnm-node");
  assert.equal(QNS_CD.runtime_cites, "https://github.com/AzielEliab/aziel-runtime");
  assert.match(QNS_CD.designs, /aziel-runtime\/tree\/main\/docs\/designs/);
  assert.equal(QNS_CD.pair_custody, "https://github.com/AzielEliab/azinterface");
  assert.equal(QNS_CD.public_qnsd_proxy, false);
  assert.equal(QNS_CD.node_gate, false);
  assert.equal(QNS_CD.softwares_tab, false);
  assert.equal(QNS_CD.author, "Aziel Eliab");
  assert.equal(QNS_CD.identity, "Aziel Eliab");
  assert.equal(QNS_CD_PUBLIC_PROXY, false);
  assert.equal(QNS_CD_SOFTWARES_TAB, false);
  assert.match(MESH_NOTE, /QNS-CD-1\.0/);
  assert.match(MESH_NOTE, /photon QNS1 packet transfer/);
  assert.equal(MESH_DEFAULT_OFF, true);
  assert.equal(MESH_NODE_GATE, false);
  assert.equal(Object.keys(MESH_ROUTE_METHODS).some((p) => p.includes("qnsd")), false);

  const empty = emptyMesh();
  assert.equal(empty.enabled, false);
  assert.equal(empty.qns_cd_spec, QNS_CD_SPEC);
  assert.equal(empty.qns_cd, QNS_CD);

  const pub = publicMesh();
  assert.equal(pub.enabled, false);
  assert.equal(pub.qns_cd_spec, QNS_CD_SPEC);
  assert.equal(pub.qns_cd.spec, "QNS-CD-1.0");

  const pointer = meshPointer();
  assert.equal(pointer.enabled_default, false);
  assert.equal(pointer.qns_cd.spec, "QNS-CD-1.0");

  const attached = attachQnsCd({ ok: true, enabled: false, live_nodes: 0 });
  assert.equal(attached.enabled, false);
  assert.equal(attached.qns_cd_spec, "QNS-CD-1.0");
  assert.equal(attached.qns_cd.public_qnsd_proxy, false);
});

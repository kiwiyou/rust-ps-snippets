import { component$ } from "@builder.io/qwik";
import { css } from "~/styled-system/css";

export default component$(() => {
	return (
		<>
			<header
				class={css({
					pos: "sticky",
					top: 0,
					z: "50",
					display: "flex",
					flexWrap: "wrap",
					alignItems: "center",
					justifyContent: "space-between",
					borderBottom: "1px solid {colors.border}",
					bg: "bg",
					px: "1rem",
					color: "text",
					lg: {
						px: "1.5rem",
					},
				})}
			>
				<div
					class={css({
						pos: "relative",
						display: "flex",
						flexGrow: "1",
						flexBasis: 0,
						alignItems: "center",
						spaceX: ".5rem",
					})}
				>
					<span
						class={css({
							fontSize: "xl",
							textStyle: "display",
							color: "text.heading",
							userSelect: "none",
						})}
					>
						Rust Snippets for Algorithmic Problem Solving
					</span>
				</div>
				<div
					class={css({
						pos: "relative",
						display: "flex",
						flexBasis: 0,
						justifyContent: "end",
						alignItems: "center",
						py: ".5rem",
						md: {
							flexGrow: "1",
						},
					})}
				>
					<a
						href="https://github.com/kiwiyou/rust-ps-snippets"
						target="_blank"
						class={css({
							p: ".625rem",
							mx: ".5rem",
							borderRadius: "sm",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							color: "text.body",
							transition: "all .15s cubic-bezier(.4,0,.2,1)",
							_hover: {
								color: "text.hover/20",
								bg: "bg.selected",
							},
						})}
					>
						<iconify-icon
							icon="octicon:mark-github-16"
							height="1.5rem"
						></iconify-icon>
					</a>
				</div>
			</header>
			<div
				class={css({
					pos: "relative",
					display: "flex",
					justifyContent: "center",
					bg: "bg",
				})}
			>
				<div
					class={css({
						display: "hidden",
						lg: {
							pos: "relative",
							display: "block",
							flex: "none",
						},
					})}
				>
					<div
						class={css({
							pos: "sticky",
							top: "61px",
							h: "calc(100vh - 61px)",
							overflowY: "auto",
							py: "1.5rem",
							pl: "1.5rem",
							pr: ".5rem",
						})}
					>
						<nav
							class={css({
								w: "13rem",
								lg: {
									fontSize: "sm",
								},
							})}
						>
							<ul
								class={css({
									spaceY: "2.25rem",
								})}
							>
								<li
									class={css({
										pos: "relative",
									})}
								>
									<h2
										class={css({
											fontSize: "md",
											color: "text.heading",
											textStyle: "display",
										})}
									>
										Overview
									</h2>
									<ul
										class={css({
											mt: ".5rem",
											fontSize: "sm",
											lg: {
												mt: ".5rem",
											},
										})}
									>
										<li
											class={css({
												pos: "relative",
											})}
										>
											<a
												href="/"
												class={css({
													display: "flex",
													alignItems: "center",
													justifyContent: "space-between",
													w: "full",
													borderRadius: "sm",
													px: ".75rem",
													py: ".5rem",
													color: "text.body",
													transition: "all .15s cubic-bezier(.4,0,.2,1)",
													_hover: {
														color: "text.hover",
														bg: "bg.selected",
													},
												})}
											>
												<span>Introduction</span>
											</a>
										</li>
									</ul>
								</li>
							</ul>
						</nav>
					</div>
				</div>
				<div
					class={css({
						minW: 0,
						mx: "auto",
						maxW: "2xl",
						flex: "1 1 auto",
						px: "1rem",
						py: "4rem",
						lg: {
							maxW: "5xl",
						},
						xl: {
							px: "4rem",
						},
					})}
				>
					<article>
						<div
							class={css({
								maxW: "none",
								color: "text.body",
								lineHeight: "1.75",
								"& > :first-child": {
									marginTop: 0,
								},
							})}
						>
							<h1
								id="introduction"
								class={css({
									textStyle: "display",
									fontSize: "2.25rem",
									marginBottom: ".9rem",
									margin: 0,
									lineHeight: "1.11",
									color: "text.heading",
									lg: {
										scrollMarginTop: "8.5rem",
									},
								})}
							>
								Introduction
							</h1>
							<p
								class={css({
									my: "1.25rem",
								})}
							>
								<i>
									Rust has <strong>fancy</strong> ability to abstract
									algorithms. Why don't we use it in PS domain?
								</i>
							</p>

							<p
								class={css({
									my: "1.25rem",
								})}
							>
								Many algorithms and data structures are exhausting and boring to
								implement every time. You can copy ready-made implementations
								here and focus on the logic.
							</p>
						</div>
					</article>
					<footer
						class={css({
							borderTop: "1px solid {colors.border}",
							mt: "1.5rem",
						})}
					>
						<div
							class={css({
								mx: "auto",
								px: "1rem",
							})}
						>
							<div
								class={css({
									py: "2rem",
									gap: "1rem",
									justifyContent: "center",
									display: "flex",
									color: "text.body",
									md: {
										py: "3rem",
									},
								})}
							>
								<p>Made with &#x2764; for Kobalte</p>
							</div>
						</div>
					</footer>
				</div>
				<div
					class={css({
						display: "hidden",
						xl: {
							display: "block",
							pos: "sticky",
							top: "61px",
							h: "calc(100vh - 61px)",
							flex: "none",
							overflowY: "auto",
							py: "1rem",
							pr: "1.5rem",
						},
					})}
				>
					<nav
						class={css({
							w: "56",
						})}
						aria-labelledby="outline-title"
					>
						<h2
							id="outline-title"
							class={css({
								textStyle: "display",
								fontSize: "sm",
								color: "text.heading",
							})}
						>
							Outline
						</h2>
						<ol
							class={css({
								mt: ".5rem",
								fontSize: "sm",
							})}
						>
							<li>
								<h3>
									<a
										class={css({
											display: "block",
											w: "full",
											borderRadius: "sm",
											px: ".75rem",
											py: ".5rem",
											color: "text.body",
											transition: "all .15s cubic-bezier(.4,0,.2,1)",
											_hover: {
												bg: "bg.selected",
												color: "text.hover",
											},
										})}
										href="#introduction"
									>
										Introduction
									</a>
								</h3>
							</li>
						</ol>
					</nav>
				</div>
			</div>
		</>
	);
});
